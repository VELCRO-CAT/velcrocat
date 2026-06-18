# 벨크로캣 — 후이즈 클라우드 서버(VPS) 이전 가이드

> 나중에 Render·Vercel을 떠나 **후이즈 VPS 한 대에 프론트+백엔드+DB를 전부** 올릴 때를 위한 런북.
> 지금 당장 실행할 필요는 없고, 이전 시점에 위에서부터 순서대로 따라가면 됩니다.
> OS 기준: **Ubuntu 22.04/24.04 LTS** (CentOS/Rocky면 패키지 명령만 dnf로 바꾸면 됨).

## 이전 후 구조
```
후이즈 VPS (Ubuntu)
 ├─ Nginx        : vcat.kr 요청 처리
 │    ├─ /              → 프론트 정적파일(frontend/dist) 서빙 (SPA)
 │    ├─ /api/*         → 127.0.0.1:5000 (Node) 프록시
 │    └─ /uploads/*     → 127.0.0.1:5000 (Node) 프록시
 ├─ Node.js(pm2) : Express 백엔드, 24시간 상주
 └─ PostgreSQL   : 로컬 DB (localhost)
```
> 코드 변경은 **DB SSL 처리 1곳뿐**(이미 반영됨 — `backend/db.js`, `knexfile.js`가 localhost면 SSL 자동 off).
> 프론트는 상대경로 `/api`를 쓰므로 Nginx 같은 도메인 프록시로 **코드 수정 없이** 연결됨.

---

## ⚠️ Vercel·Render 삭제 전 필수 체크리스트 (코드 감사로 검증됨)
이 순서를 다 끝내고 **새 VPS에서 동작을 확인한 다음에만** Vercel·Render를 삭제할 것.
1. **[되돌릴 수 없음] 라이브 uploads 전체 백업** — Render 디스크는 ephemeral. git에 없는 최신 업로드는 Render 삭제 시 영구 소실 (0번).
2. **[되돌릴 수 없음] 라이브 DB pg_dump 백업** — `dev-db.json` 자동복원은 git 시점 stale 데이터라 의존 금지 (0번).
3. **VPS에서 `npm run build` 필수** — `frontend/dist`는 .gitignore라 clone에 없음. 안 하면 화면이 통째로 안 뜸 (8번).
4. **Nginx 3규칙** — SPA fallback(`try_files`) + `/api` 프록시 + `/uploads` 프록시 (10번).
5. **`.env` 필수값** — `JWT_SECRET`(없으면 네이버/회원 토큰발급이 500으로 죽음), `DATABASE_URL`(localhost), `NAVER_CALLBACK_URL=https://vcat.kr/auth/naver/callback`(/api 아님!) (5번).
6. **외부 콘솔 갱신** — 네이버 개발자센터 콜백 URL, 메인페이(MPC) 서버 notify URL을 vcat.kr 기준으로 등록 (12번).
7. **DNS는 마지막** — 위가 다 준비된 뒤 A레코드를 VPS IP로, 그다음 certbot HTTPS (11번).

---

## 0. (이전 전) Render에서 데이터 백업  ⚠️ 가장 중요
Render를 내리기 **전에** 반드시 데이터부터 빼두세요. (Render 무료 DB는 방치 시 삭제될 수 있음)

내 PC(또는 VPS)에서, Render 대시보드의 **External Database URL**로:
```bash
# DB 전체(스키마+데이터) 덤프
pg_dump "postgres://USER:PASS@EXTERNAL_HOST/DBNAME" --no-owner --no-acl > velcrocat_backup.sql

# 업로드 이미지(상품 사진)도 확보 — 로컬 backend/uploads 가 최신인지 확인,
# 아니면 현재 서버에서 받아둘 것. (이 저장소엔 backend/uploads 약 343MB 존재)
```

---

## 1. VPS 기본 설정
```bash
ssh root@서버IP
adduser deploy && usermod -aG sudo deploy   # 작업용 계정
# 방화벽
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

## 2. 필수 패키지 설치
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL, Nginx, git, certbot
sudo apt install -y postgresql nginx git certbot python3-certbot-nginx

# pm2 (Node 프로세스 상시 구동)
sudo npm install -g pm2
```

## 3. PostgreSQL DB/계정 생성
```bash
sudo -u postgres psql <<'SQL'
CREATE USER velcrocat WITH PASSWORD '강한_비밀번호';
CREATE DATABASE velcrocat OWNER velcrocat;
GRANT ALL PRIVILEGES ON DATABASE velcrocat TO velcrocat;
SQL
```
→ 이 값이 `.env`의 `DATABASE_URL=postgres://velcrocat:강한_비밀번호@localhost:5432/velcrocat`

## 4. 코드 배포
```bash
sudo mkdir -p /var/www/velcrocat && sudo chown deploy:deploy /var/www/velcrocat
cd /var/www/velcrocat
git clone https://github.com/JIHOJ-U/osakamarket.git .

# 백엔드 의존성
cd backend && npm install
```

## 5. 백엔드 .env 작성
```bash
cd /var/www/velcrocat/backend
cp .env.example .env
nano .env     # DATABASE_URL, JWT_SECRET(openssl rand -hex 32), 메일/네이버/결제 값 채우기
```

## 6. DB 복원 (0번 백업본 사용)
```bash
# 백업 SQL을 그대로 복원 (스키마+데이터 한 번에)
psql "postgres://velcrocat:강한_비밀번호@localhost:5432/velcrocat" < velcrocat_backup.sql
```
> 백업이 없다면(새로 시작): 서버 첫 기동 시 `db.migrate.latest()`가 테이블을 만들고 시드가 들어갑니다(6번 건너뛰고 9번으로).

## 7. 업로드 이미지 복원
상품 이미지(`backend/uploads`)는 **대부분 git에 포함돼 clone 시 따라오지만, 전부는 아닙니다.**
Render 운영 중 관리자가 올린 최신 이미지는 git에 없고 Render 디스크(ephemeral)에만 있어,
**Render를 끄기 전에 0번에서 받아둔 라이브 uploads로 보강**해야 합니다. (안 받아두면 영구 소실)
```bash
# 0번에서 scp/rsync로 받아둔 라이브 uploads를 덮어쓰기(없는 것만 보강)
cp -rn ~/uploads/* /var/www/velcrocat/backend/uploads/
```
> 참고: 현재 dev-db.json 기준 이미지 2장(상품 #31 '남여 반팔티셔츠', #32 'ㅇㅇㅇ'(테스트))은
> 이미 git·Render 양쪽에 없어 복구 불가. #32는 테스트 상품이라 dev-db.json에서 지워도 됨.

## 8. 프론트 빌드
```bash
cd /var/www/velcrocat/frontend
npm install
npm run build      # → frontend/dist 생성 (Nginx가 이걸 서빙)
```

## 9. 백엔드 구동 (pm2)
```bash
cd /var/www/velcrocat/backend
pm2 start server.js --name velcrocat-api
pm2 save
pm2 startup        # 출력되는 명령을 복사해 실행 → 재부팅 시 자동 기동
```

## 10. Nginx 설정
`/etc/nginx/sites-available/velcrocat` 생성:
```nginx
server {
    listen 80;
    server_name vcat.kr www.vcat.kr;

    client_max_body_size 50M;                 # 이미지 업로드(최대 20MB) 여유

    root /var/www/velcrocat/frontend/dist;    # 프론트 빌드 결과
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
    }
    location / {
        try_files $uri $uri/ /index.html;     # SPA 라우팅
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/velcrocat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 11. 도메인 + HTTPS
1. 후이즈/도메인 관리에서 **vcat.kr, www.vcat.kr A레코드 → VPS IP** 로 변경 (Vercel 가리키던 것 교체)
2. DNS 전파 후:
```bash
sudo certbot --nginx -d vcat.kr -d www.vcat.kr   # 자동 HTTPS + 갱신 등록
```

## 12. 점검 체크리스트
- [ ] `pm2 status` 에 velcrocat-api online
- [ ] `curl -I https://vcat.kr` → 200, 화면 정상
- [ ] `curl https://vcat.kr/api/products` → JSON 반환(503/404 아님)
- [ ] 상품 이미지(/uploads) 표시됨
- [ ] 로그인·장바구니·주문·관리자(/admin) 동작
- [ ] 네이버 로그인/결제 콜백 URL이 vcat.kr 기준으로 갱신됨(네이버·결제사 콘솔에서도 변경)

## 13. 이후 업데이트(재배포)
```bash
cd /var/www/velcrocat && git pull
cd backend && npm install && pm2 restart velcrocat-api
cd ../frontend && npm install && npm run build   # 프론트 변경 시
```

---
### 참고
- 이전 시 함께 정리할 환경변수 보안 항목은 `memory`의 "deferred-security-hardening" 참고
  (관리자 계정/JWT 시크릿을 `.env`로, git에 노출된 비번 교체, CORS 화이트리스트).
- 기존 `frontend/vercel.json`, `render.yaml`은 이전 후엔 사용하지 않음(삭제하거나 남겨둬도 무방).
