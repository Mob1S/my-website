// =============================================
// 图片画廊数据 — 从 JSON 文件异步加载
// 数据由 admin/ 开发面板管理
// =============================================

export async function loadCityImages() {
  try {
    const res = await fetch('admin/data/city-images.json');
    return await res.json();
  } catch (e) {
    console.warn('Failed to load city-images.json');
    return {};
  }
}

export async function loadHobbyImages() {
  try {
    const res = await fetch('admin/data/hobby-images.json');
    return await res.json();
  } catch (e) {
    console.warn('Failed to load hobby-images.json');
    return {};
  }
}

export async function loadPersonImages() {
  try {
    const res = await fetch('admin/data/person-images.json');
    return await res.json();
  } catch (e) {
    console.warn('Failed to load person-images.json');
    return {};
  }
}

export async function loadHobbyMeta() {
  try {
    const res = await fetch('admin/data/hobby-meta.json');
    return await res.json();
  } catch (e) {
    console.warn('Failed to load hobby-meta.json');
    return {};
  }
}

export async function loadPersonMeta() {
  try {
    const res = await fetch('admin/data/person-meta.json');
    return await res.json();
  } catch (e) {
    console.warn('Failed to load person-meta.json');
    return {};
  }
}

export async function loadDistrictImages() {
  try {
    const res = await fetch('admin/data/district-images.json');
    return await res.json();
  } catch (e) {
    console.warn('Failed to load district-images.json');
    return {};
  }
}
