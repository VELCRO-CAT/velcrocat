const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  await knex('orders').del();
  await knex('products').del();
  await knex('categories').del();
  await knex('users').del();

  await knex('users').insert([
    { name: '관리자', email: 'osakamarket0316@osakamarket.kr', password: bcrypt.hashSync('osakamarket0316', 10), role: 'admin' },
    { name: '테스트유저', email: 'user@osakamarket.kr', password: bcrypt.hashSync('user123', 10), role: 'user' }
  ]);

  await knex('categories').insert([
    { slug: 'outer', name: '아우터', name_en: 'Outer', icon: '🧥' },
    { slug: 'tops', name: '탑스', name_en: 'Tops', icon: '👕' },
    { slug: 'bottoms', name: '바텀스', name_en: 'Bottoms', icon: '👖' },
    { slug: 'roomwear', name: '룸웨어', name_en: 'Roomwear', icon: '🏠' }
  ]);

  await knex('products').insert([
    // 아우터
    { name: '마운틴 파커 블랙', name_en: 'Mountain Parker Black', price: 49000, category: 'outer', image: 'https://placehold.co/600x600/1a1a1a/ffffff?text=OUTER', description: '방풍·방수 기능을 갖춘 마운틴 파커. 활동적인 라이프스타일에 최적.', rating: 4.7, stock: 40, seller: '오사카마켓' },
    { name: '블루종 네이비', name_en: 'Blouson Navy', price: 42000, category: 'outer', image: 'https://placehold.co/600x600/1a2744/ffffff?text=OUTER', description: '스포티하고 깔끔한 실루엣의 블루종. 코디하기 쉬운 네이비 컬러.', rating: 4.5, stock: 35, seller: '오사카마켓' },
    { name: '커버올 올리브', name_en: 'Coverall Olive', price: 55000, category: 'outer', image: 'https://placehold.co/600x600/4a5240/ffffff?text=OUTER', description: '워크웨어 감성의 커버올. 빈티지한 무드를 연출.', rating: 4.4, stock: 25, seller: '오사카마켓' },
    { name: '울 코트 카멜', name_en: 'Wool Coat Camel', price: 89000, category: 'outer', image: 'https://placehold.co/600x600/c8a86b/ffffff?text=OUTER', description: '고급 울 혼방 소재의 롱 코트. 가을·겨울 시즌 정통 아이템.', rating: 4.8, stock: 20, seller: '오사카마켓' },
    { name: '나일론 파커 카키', name_en: 'Nylon Parker Khaki', price: 38000, category: 'outer', image: 'https://placehold.co/600x600/6b7c4a/ffffff?text=OUTER', description: '경량 나일론 소재 파커. 비바람을 막아주는 실용적 디자인.', rating: 4.3, stock: 50, seller: '오사카마켓' },

    // 탑스
    { name: '그래픽 롱 티셔츠 블랙', name_en: 'Graphic Long Tee Black', price: 29000, category: 'tops', image: 'https://placehold.co/600x600/111111/ffffff?text=TOPS', description: '면 100% 소재의 그래픽 롱 티셔츠. 아메카지 스타일의 핵심 아이템.', rating: 4.6, stock: 80, seller: '오사카마켓' },
    { name: '크루넥 스웨트 그레이', name_en: 'Crewneck Sweat Gray', price: 35000, category: 'tops', image: 'https://placehold.co/600x600/888888/ffffff?text=TOPS', description: '두툼한 기모 안감의 크루넥 스웨트. 심플하고 편안한 착용감.', rating: 4.5, stock: 60, seller: '오사카마켓' },
    { name: '후디 스웨트 네이비', name_en: 'Hoodie Sweat Navy', price: 38000, category: 'tops', image: 'https://placehold.co/600x600/1e2f55/ffffff?text=TOPS', description: '넉넉한 실루엣의 후드 스웨트. 캐주얼 코디에 활약.', rating: 4.7, stock: 70, seller: '오사카마켓' },
    { name: '반소매 티셔츠 화이트', name_en: 'Short Sleeve Tee White', price: 19000, category: 'tops', image: 'https://placehold.co/600x600/f0f0f0/333333?text=TOPS', description: '깔끔한 화이트 반소매 티셔츠. 어떤 바텀과도 매칭 가능.', rating: 4.4, stock: 120, seller: '오사카마켓' },
    { name: '체크 긴팔 셔츠', name_en: 'Check Long Sleeve Shirt', price: 32000, category: 'tops', image: 'https://placehold.co/600x600/8b6f5e/ffffff?text=TOPS', description: '클래식 체크 패턴의 긴팔 셔츠. 겹쳐 입기에도 좋은 아이템.', rating: 4.3, stock: 45, seller: '오사카마켓' },
    { name: '탱크탑 블랙', name_en: 'Tank Top Black', price: 15000, category: 'tops', image: 'https://placehold.co/600x600/222222/ffffff?text=TOPS', description: '여름철 필수 탱크탑. 시원하고 활동적인 착용감.', rating: 4.2, stock: 100, seller: '오사카마켓' },
    { name: '트레이너 그레이멜란지', name_en: 'Trainer Gray Melange', price: 33000, category: 'tops', image: 'https://placehold.co/600x600/9e9e9e/ffffff?text=TOPS', description: '두툼한 트레이너 소재 상의. 스포티한 매일 코디에 최적.', rating: 4.5, stock: 55, seller: '오사카마켓' },
    { name: '로고 후드 블랙', name_en: 'Logo Hoodie Black', price: 41000, category: 'tops', image: 'https://placehold.co/600x600/0d0d0d/ffffff?text=TOPS', description: '가슴 로고 포인트의 빅실루엣 후디. 스트리트 감성 연출.', rating: 4.6, stock: 65, seller: '오사카마켓' },

    // 바텀스
    { name: '조거 팬츠 블랙', name_en: 'Jogger Pants Black', price: 28000, category: 'bottoms', image: 'https://placehold.co/600x600/1a1a1a/ffffff?text=BOTTOMS', description: '사이드 2라인 조거 팬츠. 폴리에스터 100% 스트레치 소재.', rating: 4.8, stock: 90, seller: '오사카마켓' },
    { name: '카고 팬츠 올리브', name_en: 'Cargo Pants Olive', price: 45000, category: 'bottoms', image: 'https://placehold.co/600x600/5c6b3a/ffffff?text=BOTTOMS', description: '대용량 포켓의 카고 팬츠. 스트리트·밀리터리 무드.', rating: 4.5, stock: 40, seller: '오사카마켓' },
    { name: '치노 팬츠 베이지', name_en: 'Chino Pants Beige', price: 36000, category: 'bottoms', image: 'https://placehold.co/600x600/d4bc94/333333?text=BOTTOMS', description: '깔끔한 베이지 치노 팬츠. 캐주얼부터 스마트 캐주얼까지 활용.', rating: 4.4, stock: 55, seller: '오사카마켓' },
    { name: '하프 팬츠 네이비', name_en: 'Half Pants Navy', price: 23000, category: 'bottoms', image: 'https://placehold.co/600x600/1e3a5f/ffffff?text=BOTTOMS', description: '여름 필수 하프 팬츠. 시원하고 활동적인 반바지.', rating: 4.3, stock: 70, seller: '오사카마켓' },
    { name: '저지 팬츠 차콜', name_en: 'Jersey Pants Charcoal', price: 25000, category: 'bottoms', image: 'https://placehold.co/600x600/444444/ffffff?text=BOTTOMS', description: '부드러운 저지 소재 팬츠. 착용감이 가벼운 이지 팬츠.', rating: 4.6, stock: 80, seller: '오사카마켓' },

    // 룸웨어
    { name: '저지 상하 세트 그레이', name_en: 'Jersey Set Gray', price: 52000, category: 'roomwear', image: 'https://placehold.co/600x600/b0b0b0/333333?text=ROOMWEAR', description: '부드러운 저지 소재의 상하 세트. 홈웨어부터 가벼운 외출까지.', rating: 4.7, stock: 35, seller: '오사카마켓' },
    { name: '룸웨어 세트 블랙', name_en: 'Roomwear Set Black', price: 48000, category: 'roomwear', image: 'https://placehold.co/600x600/2a2a2a/ffffff?text=ROOMWEAR', description: '심플하고 모던한 블랙 룸웨어 세트. 편안하고 세련된 홈웨어.', rating: 4.5, stock: 30, seller: '오사카마켓' },
    { name: '스웨트 상하 세트 네이비', name_en: 'Sweat Set Navy', price: 58000, category: 'roomwear', image: 'https://placehold.co/600x600/162040/ffffff?text=ROOMWEAR', description: '기모 안감의 따뜻한 스웨트 세트업. 가을·겨울 룸웨어의 정석.', rating: 4.6, stock: 25, seller: '오사카마켓' }
  ]);
};
