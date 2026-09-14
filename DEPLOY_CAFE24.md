# 벨크로캣 — 카페24 이지업 서버호스팅(StartUP) 이전 가이드

> Render·Vercel을 떠나 **카페24 이지업 서버호스팅 StartUP(1CPU / 1GB RAM / 25GB SSD / 1TB 트래픽, 월 14,900원) 한 대**에
> 프론트+백엔드+DB를 전부 올릴 때를 위한 런북.
> OS: **Ubuntu 24.04**로 신청(Rocky 9.x도 선택 가능하지만, 이 가이드 명령어는 전부 apt 기준이라 Ubuntu 추천).
> 도메인 `vcat.kr`은 이미 같은 카페24 계정에 있으므로, 후이즈 VPS 안(DEPLOY.md)과 달리
> **DNS 변경도 카페24 관리자 페이지 안에서 그대로 처리**하면 됩니다.
>
> ⚠️ **RAM이 1GB뿐이라 스왑이 필수입니다.** 스왑 없이 `npm run build`를 돌리면 빌드 도중
> OOM(메모리 부족)으로 프로세스가 죽을 가능성이 높습니다. 아래 **2-1단계 스왑 설정을
> 패키지 설치보다 먼저** 해두세요. 나중에 트래픽/부하가 늘면 카페24에서 EASY A 등으로
> "이용 중 업그레이드"가 가능하니, 지금은 StartUP으로 시작해도 괜찮습니다.

## 이전 후 구조
```
카페24 이지업 서버호스팅 StartUP (Ubuntu 24.04)
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

## ⚠️ Vercel·Render 삭제 전 필수 체크리스트
이 순서를 다 끝내고 **카페24 서버에서 동작을 확인한 다음에만** Vercel·Render를 삭제할 것.
1. **[되돌릴 수 없음] 라이브 uploads 전체 백업** — Render 디스크는 ephemeral. git에 없는 최신 업로드는 Render 삭제 시 영구 소실.
2. **[되돌릴 수 없음] 라이브 DB pg_dump 백업** — `dev-db.json` 자동복원은 git 시점 stale 데이터라 의존 금지.
3. **카페24 서버에서 `npm run build` 필수** — `frontend/dist`는 .gitignore라 clone에 없음.
4. **Nginx 3규칙** — SPA fallback(`try_files`) + `/api` 프록시 + `/uploads` 프록시.
5. **`.env` 필수값** — `JWT_SECRET`, `DATABASE_URL`(localhost), `NAVER_CALLBACK_URL=https://vcat.kr/auth/naver/callback`(/api 아님!).
6. **외부 콘솔 갱신** — 네이버 개발자센터 콜백 URL, 메인페이(MPC) 서버 notify URL을 vcat.kr 기준으로 등록.
7. **DNS는 마지막** — 위가 다 준비된 뒤 카페24 도메인관리에서 A레코드를 서버 IP로, 그다음 certbot HTTPS.

---

## 0. (구매 전) Render에서 데이터 백업  ⚠️ 가장 중요
Render를 내리기 **전에** 반드시 데이터부터 빼두세요.
```bash
pg_dump "postgres://USER:PASS@EXTERNAL_HOST/DBNAME" --no-owner --no-acl > velcrocat_backup.sql
# backend/uploads(상품 사진, 약 343MB)도 로컬에 최신본이 있는지 확인
```

## 1. 카페24 서버 구매
1. https://hosting.cafe24.com/ → **서버호스팅 > 이지업 서버호스팅** → **StartUP(1CPU/1GB/25GB, 월 14,900원)** 선택.
2. OS: **Ubuntu 24.04** 선택.
3. 신청 화면에서 **root 비밀번호를 직접 설정** (잊지 말고 기록해둘 것 — 강한 비밀번호 사용).
4. 결제 완료 후 세팅 완료 메일이 오거나, **나의서비스관리 > 서비스사용현황 > 서버 임시 접속 정보**에서
   할당된 **서버 IP**를 확인할 수 있음 (임시 접속 정보는 세팅일로부터 2주 후 조회 불가 — 미리 root 비번을 알고 있으면 상관없음).
5. SSH 접속이 안 되면 **호스팅관리 > 보안관리 > FTP/Shell 접속설정**에서 차단 여부 확인.

## 2. 서버 기본 설정
```bash
ssh root@서버IP
adduser deploy && usermod -aG sudo deploy   # 작업용 계정
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

## 2-1. 스왑 설정 (RAM 1GB 대비, 필수)
RAM이 1GB뿐이라 스왑 없이는 `npm install`/`npm run build`가 OOM으로 죽을 가능성이 높습니다.
디스크는 25GB로 여유 있으니 **패키지 설치 전에** 스왑 3GB를 먼저 만들어둡니다.
```bash
sudo fallocate -l 3G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h   # Swap 3.0G 확인
```

## 3. 필수 패키지 설치
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL, Nginx, git, certbot
sudo apt install -y postgresql nginx git certbot python3-certbot-nginx

# pm2 (Node 프로세스 상시 구동)
sudo npm install -g pm2
```

## 4. PostgreSQL DB/계정 생성
```bash
sudo -u postgres psql <<'SQL'
CREATE USER velcrocat WITH PASSWORD '강한_비밀번호';
CREATE DATABASE velcrocat OWNER velcrocat;
GRANT ALL PRIVILEGES ON DATABASE velcrocat TO velcrocat;
SQL
```
→ 이 값이 `.env`의 `DATABASE_URL=postgres://velcrocat:강한_비밀번호@localhost:5432/velcrocat`

## 5. 코드 배포
```bash
sudo mkdir -p /var/www/velcrocat && sudo chown deploy:deploy /var/www/velcrocat
cd /var/www/velcrocat
git clone https://github.com/JIHOJ-U/osakamarket.git .

cd backend && npm install
```

## 6. 백엔드 .env 작성
```bash
cd /var/www/velcrocat/backend
cp .env.example .env
nano .env     # DATABASE_URL, JWT_SECRET(openssl rand -hex 32), 메일/네이버/결제 값 채우기
```

## 7. DB 복원 (0번 백업본 사용)
```bash
psql "postgres://velcrocat:강한_비밀번호@localhost:5432/velcrocat" < velcrocat_backup.sql
```
> 백업이 없다면(새로 시작): 서버 첫 기동 시 `db.migrate.latest()`가 테이블을 만들고 시드가 들어갑니다(8번으로).

## 8. 업로드 이미지 복원
```bash
cp -rn ~/uploads/* /var/www/velcrocat/backend/uploads/
```

## 9. 프론트 빌드
```bash
cd /var/www/velcrocat/frontend
npm install
npm run build      # → frontend/dist 생성 (Nginx가 이걸 서빙)
```

## 10. 백엔드 구동 (pm2)
```bash
cd /var/www/velcrocat/backend
pm2 start server.js --name velcrocat-api
pm2 save
pm2 startup        # 출력되는 명령을 복사해 실행 → 재부팅 시 자동 기동
```

## 11. Nginx 설정
`/etc/nginx/sites-available/velcrocat` 생성:
```nginx
server {
    listen 80;
    server_name vcat.kr www.vcat.kr;

    client_max_body_size 50M;

    root /var/www/velcrocat/frontend/dist;
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
        try_files $uri $uri/ /index.html;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/velcrocat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 12. 도메인 + HTTPS (카페24 계정 내에서 처리)
도메인이 이미 같은 카페24 계정에 있으므로, 후이즈처럼 다른 사이트로 갈 필요 없이
**hosting.cafe24.com 로그인 > 나의서비스관리 > 도메인관리 > DNS관리**에서 바로 처리합니다.
1. `vcat.kr`, `www.vcat.kr`의 **A레코드를 새 서버 IP**로 변경 (기존 Vercel을 가리키던 값 교체).
2. DNS 전파(보통 몇 분~최대 24-48시간) 후:
```bash
sudo certbot --nginx -d vcat.kr -d www.vcat.kr   # 자동 HTTPS + 갱신 등록
```

## 13. 점검 체크리스트
- [ ] `pm2 status` 에 velcrocat-api online
- [ ] `curl -I https://vcat.kr` → 200, 화면 정상
- [ ] `curl https://vcat.kr/api/products` → JSON 반환(503/404 아님)
- [ ] 상품 이미지(/uploads) 표시됨
- [ ] 로그인·장바구니·주문·관리자(/admin) 동작
- [ ] 네이버 로그인/결제 콜백 URL이 vcat.kr 기준으로 갱신됨(네이버·결제사 콘솔에서도 변경)

## 14. 이후 업데이트(재배포)
```bash
cd /var/www/velcrocat && git pull
cd backend && npm install && pm2 restart velcrocat-api
cd ../frontend && npm install && npm run build
```

---
### 참고
- 관리자 계정/JWT 시크릿을 `.env`로, git에 노출된 비번 교체, CORS 화이트리스트 — DEPLOY.md의 후이즈 가이드와 동일하게 적용.
- 기존 `frontend/vercel.json`, `render.yaml`은 이전 후엔 사용하지 않음(삭제하거나 남겨둬도 무방).
