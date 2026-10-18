Page({
  data: {
    colors: [
      { name: 'brand', v: '#00E676' },
      { name: 'brand-weak', v: '#D7F8DF' },
      { name: 'brand-ghost', v: '#EAFBF0' },
      { name: 'text-1', v: '#111111' },
      { name: 'text-2', v: '#666666' },
      { name: 'text-3', v: '#999999' },
      { name: 'fill', v: '#F7F7F7' },
      { name: 'danger', v: '#FF3B30' },
    ],
    sizes: [
      { t: 'H1 40/700', s: 40, w: 700 },
      { t: 'H2 32/600', s: 32, w: 600 },
      { t: 'Body 28/400', s: 28, w: 400 },
      { t: 'SM 24/400', s: 24, w: 400 },
      { t: 'XS 20/500', s: 20, w: 500 },
    ],
  },
  onLoad() {
    // 纯静态展示页，无需请求
  },
})
