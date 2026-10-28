// Lazy-loaded renderer; viewing a mesh never changes the inventory item or its price.
const ItemViewer = (() => {
  let loading = null;
  function library() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = 'vendor/three.min.js?v=r160';
      script.onload = () => window.THREE ? resolve(window.THREE) : reject(new Error('3D library unavailable'));
      script.onerror = () => { script.remove(); loading = null; reject(new Error('3D library load failed')); };
      document.head.appendChild(script);
    });
    return loading;
  }
  function mount(stage, holder, item) {
    const state = { rx: -0.12, ry: 0.48, zoom: 1, auto: true, disposed: false, ready: false, raf: 0, mode: '', model: null };
    const pointers = new Map();
    let renderer = null, model = null, scene = null, camera = null, canvas = null, context = null;
    let environment = null, floor = null, floorTexture = null, resizeObserver = null, observer = null;
    let previous = performance.now(), lastFrame = 0, pinch = 0;
    holder.innerHTML = '<span class="insp-loading">Готовим модель…</span>';
    function toolbar() {
      const button = document.querySelector('#modalRoot [data-act="inspAuto"]');
      if (button) { button.textContent = state.auto ? '⏸ Остановить' : '▶ Вращать'; button.setAttribute('aria-pressed', String(state.auto)); }
    }
    state.zoomBy = (factor) => { state.zoom = Math.max(0.65, Math.min(3.2, state.zoom * factor)); };
    state.toggle = () => { state.auto = !state.auto; toolbar(); };
    state.reset = () => { state.rx = -0.12; state.ry = 0.48; state.zoom = 1; state.auto = true; toolbar(); };
    state.dispose = () => {
      if (state.disposed) return;
      state.disposed = true; cancelAnimationFrame(state.raf); pointers.clear();
      if (observer) observer.disconnect(); if (resizeObserver) resizeObserver.disconnect();
      if (model) ItemModels.dispose(model);
      if (floor) { floor.geometry.dispose(); floor.material.dispose(); }
      if (floorTexture) floorTexture.dispose(); if (environment) environment.dispose();
      if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
    };
    function resize() {
      if (!camera || !canvas || state.disposed) return;
      const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (renderer) renderer.setSize(w, h, false);
      else { canvas.width = Math.round(w * Math.min(window.devicePixelRatio || 1, 1.5)); canvas.height = Math.round(h * Math.min(window.devicePixelRatio || 1, 1.5)); }
      if (state.ready) draw();
    }
    function software() {
      canvas = document.createElement('canvas'); canvas.setAttribute('aria-label', 'Объёмная модель вещи');
      holder.replaceChildren(canvas); context = canvas.getContext('2d'); state.mode = 'canvas3d';
      if (!context) throw new Error('Canvas unavailable'); resize();
    }
    function softwareFrame() {
      const T = THREE, w = canvas.width, h = canvas.height;
      context.clearRect(0, 0, w, h);
      const shadow = context.createRadialGradient(w / 2, h * 0.86, 3, w / 2, h * 0.86, w * 0.3);
      shadow.addColorStop(0, 'rgba(0,0,0,.45)'); shadow.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = shadow; context.fillRect(0, h * 0.73, w, h * 0.24);
      model.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      const triangles = [], light = new T.Vector3(-0.4, 0.8, 0.9).normalize();
      model.traverse((mesh) => {
        if (!mesh.isMesh) return;
        const geometry = mesh.geometry, positions = geometry.attributes.position, index = geometry.index;
        const vertices = [];
        for (let i = 0; i < positions.count; i++) {
          const world = new T.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
          const projected = world.clone().project(camera);
          vertices.push({ world, x: (projected.x + 1) * w / 2, y: (1 - projected.y) * h / 2, z: projected.z });
        }
        const count = index ? index.count : positions.count;
        for (let i = 0; i < count; i += 3) {
          const a = vertices[index ? index.getX(i) : i], b = vertices[index ? index.getX(i + 1) : i + 1], c = vertices[index ? index.getX(i + 2) : i + 2];
          if (!a || !b || !c || a.z > 1 || b.z > 1 || c.z > 1) continue;
          if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0 && mesh.material.side !== T.DoubleSide) continue;
          const normal = b.world.clone().sub(a.world).cross(c.world.clone().sub(a.world)).normalize();
          const color = mesh.material.color.clone().multiplyScalar(0.38 + Math.max(0, normal.dot(light)) * 0.75);
          triangles.push({ a, b, c, z: (a.z + b.z + c.z) / 3, color: color.getStyle(), opacity: mesh.material.opacity });
        }
      });
      triangles.sort((a, b) => b.z - a.z);
      for (const tri of triangles) { context.globalAlpha = tri.opacity; context.fillStyle = tri.color; context.beginPath(); context.moveTo(tri.a.x, tri.a.y); context.lineTo(tri.b.x, tri.b.y); context.lineTo(tri.c.x, tri.c.y); context.closePath(); context.fill(); }
      context.globalAlpha = 1;
    }
    function draw() {
      if (!model || !camera || state.disposed) return;
      model.rotation.set(state.rx, state.ry, 0); camera.zoom = state.zoom; camera.updateProjectionMatrix();
      if (renderer) renderer.render(scene, camera); else softwareFrame();
    }
    state.draw = draw;
    function frame(now) {
      if (state.disposed || !stage.isConnected) { state.dispose(); return; }
      state.raf = requestAnimationFrame(frame);
      if (document.hidden) { previous = now; return; }
      if (state.mode === 'canvas3d' && now - lastFrame < 50) return;
      lastFrame = now;
      const dt = Math.min(0.05, Math.max(0, (now - previous) / 1000)); previous = now;
      if (state.auto && !pointers.size) state.ry += dt * 0.2;
      draw();
    }
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault(); state.auto = false; toolbar();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* synthetic events */ }
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    });
    stage.addEventListener('pointermove', (e) => {
      const old = pointers.get(e.pointerId); if (!old) return;
      const dx = e.clientX - old.x, dy = e.clientY - old.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) { const [a, b] = [...pointers.values()], distance = Math.hypot(a.x - b.x, a.y - b.y); if (pinch > 0) state.zoomBy(distance / pinch); pinch = distance; }
      else if (pointers.size === 1) { state.ry += dx * 0.012; state.rx = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.rx + dy * 0.01)); }
    });
    const release = (e) => { pointers.delete(e.pointerId); pinch = 0; };
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release); stage.addEventListener('lostpointercapture', release);
    stage.addEventListener('wheel', (e) => { e.preventDefault(); state.zoomBy(Math.exp(-e.deltaY * 0.001)); }, { passive: false });
    stage.addEventListener('keydown', (e) => {
      const keys = { ArrowLeft: () => { state.ry -= 0.15; }, ArrowRight: () => { state.ry += 0.15; },
        ArrowUp: () => { state.rx = Math.max(-Math.PI / 2, state.rx - 0.12); }, ArrowDown: () => { state.rx = Math.min(Math.PI / 2, state.rx + 0.12); },
        '+': () => state.zoomBy(1.15), '=': () => state.zoomBy(1.15), '-': () => state.zoomBy(1 / 1.15), r: state.reset, R: state.reset, ' ': state.toggle };
      if (keys[e.key]) { e.preventDefault(); if (e.key.startsWith('Arrow')) { state.auto = false; toolbar(); } keys[e.key](); }
    });
    observer = new MutationObserver(() => { if (!stage.isConnected) state.dispose(); });
    observer.observe(document.getElementById('modalRoot'), { childList: true, subtree: true });
    state.promise = library().then((T) => {
      if (state.disposed || !stage.isConnected) return;
      model = ItemModels.build(item); state.model = model;
      scene = new T.Scene(); camera = new T.PerspectiveCamera(34, 1, 0.1, 40); camera.position.set(0, 0.12, 5.7); camera.lookAt(0, 0, 0);
      scene.add(model); scene.add(new T.HemisphereLight('#d8edff', '#6b5039', 2.2));
      const key = new T.DirectionalLight('#fff3db', 3.2); key.position.set(-3, 5, 4); scene.add(key);
      const rim = new T.DirectionalLight('#7daaff', 2.8); rim.position.set(3, 2, -3); scene.add(rim);
      const fill = new T.DirectionalLight('#ffffff', 1.1); fill.position.set(3, 0, 4); scene.add(fill);
      try {
        renderer = new T.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
        canvas = renderer.domElement; canvas.setAttribute('aria-label', 'Объёмная модель вещи'); holder.replaceChildren(canvas); state.mode = 'webgl';
        const env = document.createElement('canvas'); env.width = 512; env.height = 256;
        const c = env.getContext('2d'), gradient = c.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#9aa9bb'); gradient.addColorStop(0.5, '#18212d'); gradient.addColorStop(1, '#74614a'); c.fillStyle = gradient; c.fillRect(0, 0, 512, 256);
        c.fillStyle = '#ffffff'; c.fillRect(50, 25, 55, 100); c.fillRect(320, 45, 30, 90);
        const tex = new T.CanvasTexture(env); tex.colorSpace = T.SRGBColorSpace;
        const pmrem = new T.PMREMGenerator(renderer); environment = pmrem.fromEquirectangular(tex); scene.environment = environment.texture; pmrem.dispose(); tex.dispose();
        const shadow = document.createElement('canvas'); shadow.width = shadow.height = 128;
        const sc = shadow.getContext('2d'), gr = sc.createRadialGradient(64, 64, 4, 64, 64, 60); gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sc.fillStyle = gr; sc.fillRect(0, 0, 128, 128);
        floorTexture = new T.CanvasTexture(shadow); floor = new T.Mesh(new T.PlaneGeometry(3.5, 3.5), new T.MeshBasicMaterial({ map: floorTexture, transparent: true, depthWrite: false })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.55; scene.add(floor);
        canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (state.disposed) return; renderer.dispose(); renderer = null; software(); });
      } catch (err) {
        if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer = null; }
        software();
      }
      resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage); resize(); state.ready = true; toolbar(); draw();
      if (typeof BugReport !== 'undefined') BugReport.record('item-inspect', { item: item.name, model: model.userData.modelKind, renderer: state.mode });
      state.raf = requestAnimationFrame(frame);
    }).catch((err) => {
      if (state.disposed) return;
      holder.innerHTML = '<span class="insp-loading">Не удалось загрузить модель. Закрой осмотр и открой снова.</span>';
      if (typeof BugReport !== 'undefined') BugReport.error('item-inspect', err);
    });
    return state;
  }
  return { mount, library };
})();
