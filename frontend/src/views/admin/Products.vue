<template>
  <AdminSidebar />

  <v-main class="bg-grey-lighten-4 admin-page">
    <v-container class="admin-container" style="max-width:1100px">
      <div class="page-header">
        <div>
          <h1 class="page-title">상품 관리</h1>
          <p class="page-sub">총 {{ products.length }}개 상품</p>
        </div>
        <v-btn color="grey-darken-4" prepend-icon="mdi-plus" size="small" @click="openAdd">상품 추가</v-btn>
      </div>

      <v-progress-circular v-if="loading" indeterminate color="grey-darken-3" class="d-block mx-auto my-12" />

      <!-- 상품 카드 그리드 -->
      <v-row v-else>
        <v-col v-for="p in products" :key="p.id" cols="12" sm="6" md="4">
          <v-card variant="outlined" class="product-card">
            <div class="product-img-area">
              <img :src="p.image || 'https://placehold.co/400x400/f5f5f5/999?text=NO+IMAGE'" class="product-img" />
              <div class="product-actions-overlay">
                <v-btn size="small" variant="elevated" color="white" class="mr-1" @click="openEdit(p)">
                  <v-icon size="16">mdi-pencil</v-icon> 수정
                </v-btn>
                <v-btn size="small" variant="elevated" color="red" @click="confirmDelete(p)">
                  <v-icon size="16">mdi-delete</v-icon> 삭제
                </v-btn>
              </div>
            </div>
            <v-card-text class="pb-3">
              <v-chip size="x-small" color="grey" variant="tonal" class="mb-2">{{ categoryLabel(p.category) }}</v-chip>
              <p class="font-weight-bold text-body-2 mb-1" style="line-height:1.4">{{ p.name }}</p>
              <p class="text-caption text-grey mb-2" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ p.description }}</p>
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-bold text-body-2">₩{{ Number(p.price).toLocaleString() }}</span>
                <span class="text-caption text-grey">재고 {{ p.stock }}개</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>

  <!-- 상품 추가/수정 다이얼로그 -->
  <v-dialog v-model="showDialog" max-width="640" persistent scrollable>
    <v-card>
      <v-card-title class="pa-5 pb-3 text-body-1 font-weight-bold">
        {{ editingProduct ? '상품 수정' : '상품 추가' }}
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5">
        <v-form @submit.prevent="saveProduct" ref="formRef">

          <!-- 이미지 섹션 (최대 10장) -->
          <p class="text-caption font-weight-bold text-grey mb-2" style="letter-spacing:1px">상품 이미지 (최대 10장)</p>
          <div class="images-grid mb-3">
            <div v-for="(img, i) in imageList" :key="i" class="img-thumb">
              <img :src="img" class="img-thumb-pic" />
              <button class="img-thumb-remove" @click.prevent="removeImage(i)">&times;</button>
              <span v-if="i === 0" class="img-thumb-main">대표</span>
            </div>
            <label v-if="imageList.length < 10" class="img-thumb img-thumb-add">
              <v-icon size="28" color="grey-lighten-1">mdi-plus</v-icon>
              <span class="text-caption text-grey">추가</span>
              <input type="file" accept="image/*" multiple style="display:none" @change="handleMultiUpload" />
            </label>
          </div>
          <div class="mb-4">
            <v-text-field
              v-model="urlInput"
              label="이미지 URL 직접 입력"
              variant="outlined"
              density="compact"
              hide-details
              placeholder="https://..."
              append-inner-icon="mdi-plus-circle"
              @click:append-inner="addUrlImage"
              @keyup.enter="addUrlImage"
            />
            <p class="text-caption text-grey mt-1">JPG, PNG (최대 5MB / 장), 파일 업로드 또는 URL 입력</p>
          </div>

          <v-divider class="mb-4" />

          <!-- 기본 정보 -->
          <p class="text-caption font-weight-bold text-grey mb-3" style="letter-spacing:1px">상품 정보</p>
          <v-text-field
            v-model="form.name"
            label="상품명 *"
            variant="outlined"
            density="compact"
            class="mb-3"
            :rules="[v => !!v || '상품명을 입력해주세요']"
          />
          <v-textarea
            v-model="form.description"
            label="상품 상세설명"
            variant="outlined"
            density="compact"
            rows="3"
            class="mb-3"
            placeholder="소재, 사이즈, 특징 등을 입력해주세요"
          />
          <v-select
            v-model="form.category"
            :items="categoryItems"
            label="카테고리 *"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.price"
                label="가격 (₩) *"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₩"
                :rules="[v => v > 0 || '가격을 입력해주세요']"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.stock"
                label="재고 수량 *"
                type="number"
                variant="outlined"
                density="compact"
                suffix="개"
                :rules="[v => v >= 0 || '재고를 입력해주세요']"
              />
            </v-col>
          </v-row>

          <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-2">{{ formError }}</v-alert>
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" @click="closeDialog">취소</v-btn>
        <v-btn color="grey-darken-4" :loading="saving" @click="saveProduct">
          {{ editingProduct ? '수정 완료' : '상품 추가' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar.vue';

const products = ref([]);
const loading = ref(true);
const showDialog = ref(false);
const editingProduct = ref(null);
const saving = ref(false);
const formError = ref('');
const imageList = ref([]);
const urlInput = ref('');

const categoryItems = ref([]);

async function loadCategories() {
  try {
    const res = await axios.get('/api/categories');
    categoryItems.value = res.data.map(c => ({
      title: `[${c.gender === 'women' ? 'W' : c.gender === 'unisex' ? 'U' : 'M'}] ${c.name}`,
      value: c.slug
    }));
  } catch { /* ignore */ }
}

function categoryLabel(slug) {
  const found = categoryItems.value.find(c => c.value === slug);
  return found ? found.title : slug;
}

const defaultForm = () => ({ name: '', price: 0, stock: 0, category: 'tops', description: '', image: '', seller: '오사카마켓' });
const form = ref(defaultForm());

async function fetchProducts() {
  const res = await axios.get('/api/admin/products');
  products.value = res.data;
  loading.value = false;
}

onMounted(() => {
  loadCategories();
  fetchProducts();
});

function parseImages(p) {
  if (p.images) {
    try { return JSON.parse(p.images); } catch { /* ignore */ }
  }
  return p.image ? [p.image] : [];
}

function openAdd() {
  editingProduct.value = null;
  form.value = defaultForm();
  imageList.value = [];
  urlInput.value = '';
  formError.value = '';
  showDialog.value = true;
}

function openEdit(p) {
  editingProduct.value = p;
  form.value = { ...p };
  imageList.value = [...parseImages(p)];
  urlInput.value = '';
  formError.value = '';
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
  imageList.value = [];
}

function removeImage(i) {
  imageList.value.splice(i, 1);
}

function addUrlImage() {
  const url = urlInput.value.trim();
  if (!url) return;
  if (imageList.value.length >= 10) return;
  imageList.value.push(url);
  urlInput.value = '';
}

async function handleMultiUpload(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  const remaining = 10 - imageList.value.length;
  const toUpload = files.slice(0, remaining);
  for (const file of toUpload) {
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await axios.post('/api/upload', fd);
      imageList.value.push(res.data.url);
    } catch { /* skip failed */ }
  }
  event.target.value = '';
}

async function saveProduct() {
  saving.value = true;
  formError.value = '';
  try {
    const data = { ...form.value };
    data.image = imageList.value[0] || '';
    data.images = JSON.stringify(imageList.value);
    if (editingProduct.value) {
      await axios.put(`/api/admin/products/${editingProduct.value.id}`, data);
    } else {
      await axios.post('/api/admin/products', data);
    }
    await fetchProducts();
    showDialog.value = false;
  } catch (e) {
    formError.value = e.response?.data?.error || '저장에 실패했습니다';
  } finally {
    saving.value = false;
  }
}

async function confirmDelete(p) {
  if (confirm(`"${p.name}"을(를) 삭제하시겠습니까?`)) {
    await axios.delete(`/api/admin/products/${p.id}`);
    await fetchProducts();
  }
}
</script>

<style scoped>
.product-card { overflow: hidden; transition: box-shadow 0.2s; height: 100%; display: flex; flex-direction: column; }
.product-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; }
.product-card .v-card-text { flex: 1; display: flex; flex-direction: column; }
.product-card .v-card-text .d-flex { margin-top: auto; }
.product-img-area {
  position: relative;
  aspect-ratio: 1/1;
  overflow: hidden;
  background: #f5f5f5;
}
.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.product-card:hover .product-img { transform: scale(1.03); }
.product-actions-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.product-card:hover .product-actions-overlay { opacity: 1; }

/* 이미지 업로드 섹션 */
.image-section {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.image-preview {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.image-inputs { flex: 1; }
.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  color: #333;
  transition: background 0.2s;
  width: 100%;
}
.upload-btn:hover { background: #f5f5f5; }

/* 다중 이미지 그리드 */
.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.img-thumb {
  width: 80px;
  height: 80px;
  position: relative;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.img-thumb-pic {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  border-radius: 50%;
}
.img-thumb-main {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 9px;
  text-align: center;
  padding: 1px 0;
  letter-spacing: 1px;
}
.img-thumb-add {
  cursor: pointer;
  border: 1px dashed #ccc;
  background: #fafafa;
}
.img-thumb-add:hover { background: #f0f0f0; }

/* 공통 관리자 모바일 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-title { font-size: 20px; font-weight: 800; color: #111; }
.page-sub { font-size: 12px; color: #999; margin-top: 2px; }

@media (max-width: 768px) {
  .admin-page { padding-top: 52px !important; }
  .admin-container { padding: 16px !important; }
  .page-title { font-size: 17px; }
  .image-section { flex-direction: column; }
  .image-preview { width: 100%; height: 160px; }
}
</style>
