<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const DEFAULT_TITLE = '벨크로캣(VELCROCAT, VCAT) | 일본식 의류 쇼핑몰';
const DEFAULT_DESC = '벨크로캣(VELCROCAT, VCAT) - 일본식 의류의 트렌드와 스타일링. 가디건, 니트, 풀오버 등 프리미엄 울 100% 의류';

watch(
  () => route.fullPath,
  () => {
    const url = `https://vcat.kr${route.path}`;
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);

    // 상품 상세(/products/:id)는 데이터 로드 후 각 컴포넌트가 직접 title/description을 지정함
    if (route.path.startsWith('/products/') && route.path !== '/products/') return;

    document.title = route.meta.title || DEFAULT_TITLE;
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', route.meta.description || DEFAULT_DESC);
  },
  { immediate: true }
);
</script>

<template></template>
