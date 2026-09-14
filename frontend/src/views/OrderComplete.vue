<template>
  <v-container class="py-16 text-center">
    <v-icon size="80" color="green-darken-2" class="mb-4">mdi-check-circle</v-icon>
    <h1 class="text-h5 font-weight-bold mb-2">{{ t('orderComplete.title') }}</h1>
    <p class="text-caption text-grey mb-4" style="letter-spacing:4px">ORDER COMPLETE</p>
    <p class="text-body-1 text-grey-darken-1 mb-8" v-html="t('orderComplete.desc')"></p>
    <v-btn color="red-darken-4" size="large" to="/products">{{ t('orderComplete.continueShoppingBtn') }}</v-btn>
  </v-container>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
