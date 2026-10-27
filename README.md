# 🎮 CS2 Web Edition (Counter-Strike 2 in Browser)

Полнофункциональная трёхмерная игра в стиле **Counter-Strike 2**, работающая прямо в браузере с использованием движка Three.js и Web Audio API. 100% автономная — все процедурные текстуры, PBR материалы, 3D модели и звуковые эффекты генерируются кодом без внешних скачиваний.

---

## 🚀 Как запустить на GitHub Pages (Инструкция)

Проект полностью оптимизирован для публикации на **GitHub Pages**:

1. Создайте новый репозиторий на GitHub (например, `cs2-web`).
2. Загрузите все файлы из этой папки в корень вашего репозитория:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CS2 Web Game"
   git branch -M main
   git remote add origin https://github.com/<ВАШ_ЛОГИН>/<ВАШ_РЕПОЗИТОРИЙ>.git
   git push -u origin main
   ```
   *(Помните: Git отслеживает только файлы внутри папок, поэтому структура папок `css/`, `js/engine/`, `js/game/`, `js/maps/`, `js/data/`, `js/ui/` сохранится автоматически).*
3. В настройках репозитория на GitHub перейдите в **Settings** ➔ **Pages**.
4. В разделе **Build and deployment** выберите:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / Folder: `/ (root)`
5. Нажмите **Save**. Через 1–2 минуты игра будет доступна по ссылке:
   `https://<ВАШ_ЛОГИН>.github.io/<ВАШ_РЕПОЗИТОРИЙ>/`

---

## 🗺️ Карты (Maps)

- **de_dust2 (Dust II)**:
  - Long A (Long Doors, Pit, Car, A Site, Goose, Ramp)
  - Catwalk / Short A (Xbox, Short stairs)
  - Mid (Suicide, Top Mid, Mid Double Doors, CT Mid)
  - B Site (Upper Dark / Tunnels, B Doors, B Window, Big Box)
  - CT & T Spawns

- **de_mirage (Mirage)**:
  - A Site (Palace & Balcony, Tetris boxes, Sandwich, Triple Box, Firebox, Ninja, Stairs)
  - Mid (Top Mid, Mid Boxes, Underpass, Window Room / Sniper nest, Vent, Catwalk)
  - B Site (B Apartments corridor, Balcony, Van, Bench, Market / Kitchen)
  - CT & T Spawns

- **de_inferno (Inferno)**:
  - Banana (Banana entrance, Car, Sandbags, Half-Wall)
  - B Site (Fountain, New Box, Coffins, Ruins / Church)
  - Mid (Mid street, Boiler room, Balcony, Apartments)
  - A Site (Pit, Apartments balcony, Arch, Library, Graveyard, Truck)
  - CT & T Spawns

---

## 🔫 Оружие и Снаряжение (Weapons)

- **Винтовки**: AK-47, M4A4, M4A1-S (с глушителем), AWP (двойной зум), SSG 08, Galil AR, FAMAS, AUG, SG 553, SCAR-20, G3SG1.
- **Пистолеты**: USP-S (с глушителем), Glock-18, Desert Eagle, P250, Five-SeveN, Tec-9, Dual Berettas, CZ75-Auto, R8 Revolver.
- **ПП (SMG)**: MP9, MAC-10, MP7, MP5-SD, UMP-45, P90, PP-Bizon.
- **Дробовики и Пулемёты**: Nova, XM1014, MAG-7, Sawed-Off, M249, Negev.
- **Гранаты**:
  - **HE Grenade**: осколочный взрыв и урон по радиусу.
  - **Flashbang**: ослепление экрана с эффектом звона в ушах.
  - **Smoke Grenade**: плотное объёмное облако дыма на 18 секунд.
  - **Molotov / Incendiary**: огонь на земле с периодическим уроном.
  - **Decoy**: ложные звуки выстрелов.
- **Спец-экипировка**: Нож (быстрый удар и критический удар в спину), Zeus x27, Броня (Kevlar + Шлем), Набор сапёра (Defuse Kit), Бомба C4 (установка и обезвреживание).

---

## 🤖 Искусственный Интеллект (Bot AI)

- **Боты-союзники и боты-противники** (5v5 или настраиваемое количество).
- **4 уровня сложности**: Легко (Easy), Средне (Normal), Сложно (Hard), Эксперт (Expert).
- **Патрулирование и навигация** по вейпоинтам карт.
- **Линия видимости (Raycasting)** и угол обзора.
- **Тактика в перестрелках**: стрейфы, стрельба очередями, приседания при зажиме, отступление при малом здоровье.
- **Умная экономика (Auto-Buy)**: покупка брони, винтовок и гранат при наличии денег.
- **Работа с бомбой**: установка C4 террористами и разминирование спецназом.

---

## ⌨️ Управление (Controls)

| Клавиша | Действие |
|---|---|
| **W, A, S, D** | Передвижение (мувмент, стрейфы) |
| **SPACE** | Прыжок (Bunny Hop) |
| **SHIFT** | Бесшумная ходьба |
| **CTRL** | Приседание (уменьшение высоты и отдачи) |
| **ЛКМ (Left Click)** | Огонь / Бросок гранаты |
| **ПКМ (Right Click)** | Оптический прицел (AWP / Scout) / Сильный удар ножом |
| **R** | Перезарядка |
| **Q** | Быстрое переключение на предыдущее оружие |
| **1, 2, 3, 4, 5** | Основное / Пистолет / Нож / Гранаты / C4 |
| **B** | Меню закупки (Buy Menu) |
| **TAB** | Таблица очков (Scoreboard) |
| **E** | Заложить C4 на планте / Разминировать бомбу |
| **F** | Осмотр оружия (Inspect) |
| **Колёсико мыши** | Переключение оружия |

---

## 🏆 Режимы Игры

1. **Соревновательный (Competitive MR12)**: 12 раундов за половину, смена сторон (Halftime), экономика CS2, закупка на старте раунда, победа при 13 раундах.
2. **Бой Насмерть (Deathmatch)**: Мгновенное возрождение, свободная закупка любого оружия, максимум динамики.
3. **Обычный (Casual)**: Классический командный режим с броней на старте.

