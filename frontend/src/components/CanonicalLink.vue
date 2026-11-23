<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const DEFAULT_TITLE = '벨크로캣(VELCROCAT, VCAT) | 일본식 의류 쇼핑몰';
const DEFAULT_DESC = '벨크로캣(VELCROCAT, VCAT) - 일본식 의류의 트렌드와 스타일링. 가디건, 니트, 풀오버 등 프리미엄 울 100% 의류';

// router.afterEach는 완료된 실제 내비게이션에서만 호출된다 — 루트의 임시 시작 위치
// (START_LOCATION, fullPath가 우연히 "/"와 같음)가 끼어들 틈이 없다. 예전엔
// route.fullPath를 watch(immediate:true)했는데, "/"가 실제 페이지가 아니던 시절엔
// 문제가 없었지만 "/"에 컴포넌트를 매핑하자 START_LOCATION과 fullPath가 똑같이 "/"라
// 값이 "바뀌지" 않아 watch가 다시 안 돌고 기본 타이틀에 멈춰버리는 버그가 드러났다.
router.afterEach((to) => {
  const url = `https://vcat.kr${to.path}`;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);

  // 상품 상세(/products/:id)는 데이터 로드 후 각 컴포넌트가 직접 title/description을 지정함
  if (to.path.startsWith('/products/') && to.path !== '/products/') return;

  document.title = to.meta.title || DEFAULT_TITLE;
  const descTag = document.querySelector('meta[name="description"]');
  if (descTag) descTag.setAttribute('content', to.meta.description || DEFAULT_DESC);
});
</script>

<template></template>
