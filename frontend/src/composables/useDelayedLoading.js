import { ref, watch } from 'vue';

// loading이 threshold(ms)보다 오래 지속될 때만 true가 되는 상태를 반환한다.
// Doherty threshold(~300ms) 미만의 응답에는 스켈레톤을 띄우지 않아
// "로딩 깜빡임(flash of skeleton)"을 막는다.
export function useDelayedLoading(loadingRef, thresholdMs = 300) {
  const showSkeleton = ref(false);
  let timer = null;

  watch(loadingRef, (isLoading) => {
    clearTimeout(timer);
    if (isLoading) {
      timer = setTimeout(() => { showSkeleton.value = true; }, thresholdMs);
    } else {
      showSkeleton.value = false;
    }
  }, { immediate: true });

  return { showSkeleton };
}
