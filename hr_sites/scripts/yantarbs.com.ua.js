// source: https://yantarbs.com.ua/
// extracted: 2026-05-07T21:23:14.045Z
// scripts: 1

// === script #1 (length=9140) ===
document.addEventListener("DOMContentLoaded", function() {
    const logo = document.querySelector('.header-logo-img');
    if (logo) {
        logo.src = '/content/uploads/images/1.svg'; 
        logo.removeAttribute('srcset');
        logo.style.width = '200px';
        logo.style.height = 'auto';
    }

    const currentUrl = window.location.href;
    if (!currentUrl.includes('ircom-decor-kytaiskyi-shovk') || document.getElementById('colorModal')) return;

    const myColors = [
        { name: "White (Білий)", hex: "#ffffff" },
        { name: "Silver (Срібло)", hex: "#d9dadb" },
        { name: "Gold (Золото)", hex: "#c5a35b" },
        { name: "Matt (Матовий)", hex: "#e2e2e2" },
        { name: "F021", hex: "#DCE3E6" },
        { name: "F029", hex: "#E1EBE7" },
        { name: "F087", hex: "#F2EEDF" },
        { name: "F120", hex: "#EAE4DB" },
        { name: "F165", hex: "#E0DFDC" },
        { name: "F168", hex: "#EBE9E2" },
        { name: "G025", hex: "#D7DDE2" },
        { name: "G030", hex: "#bedae2" },
        { name: "G044", hex: "#c9d7cb" },
        { name: "G048", hex: "#deeadf" },
        { name: "G108", hex: "#e6ded4" },
        { name: "G110", hex: "#e8d2bb" },
        { name: "G148", hex: "#dad4e0" },
        { name: "G154", hex: "#dcd6cb" },
        { name: "G167", hex: "#dbd5d0" },
        { name: "V003", hex: "#b5c0c6" },
        { name: "V030", hex: "#c7d5d6" },
        { name: "V033", hex: "#dee3dc" },
        { name: "V089", hex: "#f5e0ca" },
        { name: "V097", hex: "#efe0c7" },
        { name: "V107", hex: "#daccc0" },
        { name: "V120", hex: "#d7c0b4" },
        { name: "V126", hex: "#dcd2cc" },
        { name: "V145", hex: "#e5d1d5" },
        { name: "V149", hex: "#d7d4d8" },
        { name: "V151", hex: "#d2cac8" },
        { name: "V162", hex: "#b7bdbe" },
        { name: "X037", hex: "#c1afa0" },
        { name: "X046", hex: "#c2b09c" },
        { name: "X052", hex: "#e8d4b2" },
        { name: "X065", hex: "#b4aaa4" },
        { name: "X085", hex: "#d0b295" },
        { name: "X090", hex: "#aba9a3" },
        { name: "X110", hex: "#82aab2" },
        { name: "X133", hex: "#aab0b2" },
        { name: "X143", hex: "#8fa2ae" },
        { name: "H023", hex: "#b1bedc" },
        { name: "H026", hex: "#c3c5d0" },
        { name: "H101", hex: "#d4c2ab" },
        { name: "H110", hex: "#dcc2a9" },
        { name: "H113", hex: "#d8b498" },
        { name: "H151", hex: "#cfc4c9" },
        { name: "H162", hex: "#c3c6c4" },
        { name: "H168", hex: "#cfceca" },
        { name: "S025", hex: "#c1c5ca" },
        { name: "S049", hex: "#afb8a6" },
        { name: "S083", hex: "#eed5b5" },
        { name: "S108", hex: "#b9a89a" },
        { name: "S109", hex: "#bda796" },
        { name: "S125", hex: "#d9b1a1" },
        { name: "S138", hex: "#d9c3be" },
        { name: "S141", hex: "#e3bec4" },
        { name: "S152", hex: "#bdafa6" },
        { name: "S153", hex: "#c3b6a7" },
        { name: "Y120", hex: "#aac4bf" },
        { name: "Y126 (без WX)", hex: "#627a7d" },
        { name: "N025", hex: "#a9b1ba" },
        { name: "N086", hex: "#f2c4a7" },
        { name: "N156 (без WX)", hex: "#817b72" },
        { name: "N157", hex: "#848480" },
        { name: "N167 (без WX)", hex: "#595453" },
        { name: "J035", hex: "#94bcb7" },
        { name: "J038", hex: "#73d1c5" },
        { name: "J115 (без WX)", hex: "#9d7761" },
        { name: "J153", hex: "#b8aea1" },
        { name: "J158", hex: "#97938e" },
        { name: "J168", hex: "#b8b8b7" },
        { name: "J200", hex: "#f2ebde" },
        { name: "K060 (без WX)", hex: "#b8b269" },
        { name: "K101 (без WX)", hex: "#917154" },
        { name: "K119", hex: "#ab8d84" },
        { name: "K151", hex: "#a4949a" },
        { name: "K157", hex: "#96948d" },
        { name: "M015 (без WX)", hex: "#0068ae" },
        { name: "RAL8017", hex: "#534440" },
        { name: "RAL9005", hex: "#393938" }
    ];

    const modalHtml = `
    <div id="colorModal" class="custom-modal">
        <div class="custom-modal-content">
            <span class="custom-close">&times;</span>
            <div id="step-1">
                <h2 class="modal-h2">Колекція "Китайський шовк"</h2>
                <div class="custom-color-grid" id="modal-grid"></div>
            </div>
            <div id="step-2" style="display:none;">
                <button class="custom-back-btn">← Назад до вибору</button>
                <div class="visualizer-wrapper">
                    <div class="visualizer-scene">
                        <div id="vis-color-layer" class="vis-layer"></div>
                        <div id="vis-texture-layer" class="vis-layer"></div>
                        <img id="vis-mask-layer" class="vis-layer" src="">
                    </div>
                    <div class="visualizer-info">
                        <h3 id="vis-name"></h3>
                        <p>Оберіть інтер'єр:</p>
                        <div class="room-btns">
                            <button class="room-btn active" id="btn-swatch" onclick="showBigSwatch(this)">Текстура</button>
                            <button class="room-btn" onclick="changeRoomMask(this, '/content/uploads/images/interior_10.png')">Вітальня</button>
                            <button class="room-btn" onclick="changeRoomMask(this, '/content/uploads/images/interior_20.png')">Ванна Кімната</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    const btnHtml = `
    <div id="silk-selector-block" style="margin: 20px 0; clear: both;">
        <p class="silk-selector-title">Оберіть тонування та текстуру</p>
        <button type="button" id="open-silk-modal" class="silk-btn">
            <span class="silk-btn-text">Відкрити каталог кольорів</span>
            <span class="silk-btn-arrow">→</span>
        </button>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const target = document.querySelector('.product__section--price') || document.querySelector('.product__column--right');
    if (target) target.insertAdjacentHTML('beforebegin', btnHtml);

    const swatchTexUrl = '/content/uploads/images/bump-map-1.png';
    const roomTexUrl = '/content/uploads/images/texture.png';

    window.showBigSwatch = function(btn) {
        const maskLayer = document.getElementById('vis-mask-layer');
        const textureLayer = document.getElementById('vis-texture-layer');
        maskLayer.style.display = 'none';
        textureLayer.style.backgroundImage = `url('${swatchTexUrl}')`;
        textureLayer.style.backgroundSize = 'cover';
        textureLayer.style.backgroundRepeat = 'no-repeat';
        document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
        if(btn) btn.classList.add('active');
    };

    window.changeRoomMask = function(btn, url) {
        const maskLayer = document.getElementById('vis-mask-layer');
        const textureLayer = document.getElementById('vis-texture-layer');
        maskLayer.src = url;
        maskLayer.style.display = 'block';
        textureLayer.style.backgroundImage = `url('${roomTexUrl}')`;
        textureLayer.style.backgroundSize = '200px';
        textureLayer.style.backgroundRepeat = 'repeat';
        document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };

    const modal = document.getElementById('colorModal');
    const grid = document.getElementById('modal-grid');
    
    myColors.forEach(color => {
        const card = document.createElement('div');
        card.className = 'custom-color-card';
        card.innerHTML = `
            <div class="card-swatch" style="background-color:${color.hex}">
                <div class="swatch-texture"></div>
            </div>
            <p>${color.name}</p>`;
        card.onclick = () => {
            document.getElementById('step-1').style.display = 'none';
            document.getElementById('step-2').style.display = 'block';
            document.getElementById('vis-name').innerText = color.name;
            document.getElementById('vis-color-layer').style.backgroundColor = color.hex;
            showBigSwatch(document.getElementById('btn-swatch'));
        };
        grid.appendChild(card);
    });

    document.getElementById('open-silk-modal').onclick = () => { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; };
    document.querySelector('.custom-close').onclick = () => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; };
    document.querySelector('.custom-back-btn').onclick = () => { document.getElementById('step-1').style.display = 'block'; document.getElementById('step-2').style.display = 'none'; };
    window.onclick = (e) => { if (e.target == modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; } };
});
