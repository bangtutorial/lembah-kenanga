"""Register Batch A wave 3-4 sprites into assets/manifest.json."""
import json

m = json.load(open("assets/manifest.json"))
S = m["sprites"]

S.update({
    # town buildings
    "town_hall": {"file": "sprites/buildings/town_hall.png", "frame": [224, 192], "pivot": "bottom-center", "footprint_tiles": [7, 2], "status": "approved"},
    "store": {"file": "sprites/buildings/store.png", "frame": [192, 160], "pivot": "bottom-center", "footprint_tiles": [6, 2], "status": "approved"},
    "warung": {"file": "sprites/buildings/warung.png", "frame": [160, 128], "pivot": "bottom-center", "footprint_tiles": [5, 2], "status": "approved"},
    "blacksmith": {"file": "sprites/buildings/blacksmith.png", "frame": [160, 160], "pivot": "bottom-center", "footprint_tiles": [5, 2], "status": "approved"},
    "town_props": {"file": "sprites/buildings/town_props/town_props_sheet.png", "frame": [64, 64], "cols": 3, "rows": 1,
                   "ids": ["notice_board", "fountain", "lamp"], "pivot": "bottom-center", "status": "approved"},
    # nature
    "pine": {"file": "sprites/nature/pine.png", "frame": [80, 112], "cols": 2, "rows": 1,
             "cols_variant": ["summer", "winter"], "pivot": "bottom-center", "footprint_tiles": [1, 1], "status": "approved"},
    "bridge": {"file": "sprites/nature/bridge.png", "frame": [96, 64], "pivot": "bottom-center", "status": "approved"},
    # animals: 4 frames facing left (idle, walk1, walk2, action); mirror in code for right
    "chicken": {"file": "sprites/animals/chicken/chicken_sheet.png", "frame": [32, 32], "cols": 4, "rows": 1,
                "frames": ["idle", "walk1", "walk2", "peck"], "facing": "left", "pivot": "bottom-center", "fps": 6, "status": "approved"},
    "cow": {"file": "sprites/animals/cow/cow_sheet.png", "frame": [48, 48], "cols": 4, "rows": 1,
            "frames": ["idle", "walk1", "walk2", "graze"], "facing": "left", "pivot": "bottom-center", "fps": 4, "status": "approved"},
    "dog": {"file": "sprites/animals/dog/dog_sheet.png", "frame": [48, 48], "cols": 4, "rows": 1,
            "frames": ["idle", "walk1", "walk2", "sit"], "facing": "left", "pivot": "bottom-center", "fps": 6, "status": "approved"},
    # terrain
    "sand": {"file": "sprites/terrain/sand.png", "frame": [32, 32], "tile": True, "status": "approved"},
    "plaza": {"file": "sprites/terrain/plaza.png", "frame": [32, 32], "tile": True, "status": "approved"},
    "wood_floor": {"file": "sprites/terrain/wood_floor.png", "frame": [32, 32], "tile": True, "status": "approved"},
    "wall": {"file": "sprites/terrain/wall.png", "frame": [32, 64], "tile_x": True, "status": "approved"},
    # interior
    "furniture": {"file": "sprites/interior/furniture/furniture_sheet.png", "frame": [64, 96], "cols": 4, "rows": 2,
                  "ids": ["bed", "table", "chair", "wardrobe", "tv", "rug", "lamp", "chest"], "pivot": "bottom-center", "status": "approved"},
    "shop_props": {"file": "sprites/interior/shop_props/shop_props_sheet.png", "frame": [96, 80], "cols": 4, "rows": 1,
                   "ids": ["counter", "shelf", "forge", "clinic_bed"], "pivot": "bottom-center", "status": "approved"},
    # fx
    "particles": {"file": "sprites/fx/particles/particles_sheet.png", "frame": [16, 16], "cols": 8, "rows": 1,
                  "ids": ["rain", "splash", "snow_big", "snow_small", "leaf_a", "leaf_b", "sparkle_big", "sparkle_small"],
                  "pivot": "center", "status": "approved"},
})

json.dump(m, open("assets/manifest.json", "w"), indent=2)
print("manifest sprites:", len(S))

open("assets/PROVENANCE.md", "a", encoding="utf-8").write("""
## Batch A gelombang 3-4 (2026-09-08)
| Aset | job_id | Status |
|------|--------|--------|
| animals/chicken | 3887bca8-cbf0-4508-9999-d6dcb4ab0e44 | approved |
| animals/cow | 37bf7a6a-4cf3-4aac-b019-d4943cb000be | approved |
| animals/dog | 0d9feb0a-e284-49d4-9483-8abf2eb7cec4 | approved |
| buildings/town_hall v1 (atap melayang) | f11f19f9-d963-4f82-88c2-6263d10a8d92 | rejected |
| buildings/town_hall v2 | f6f52c22-391b-438f-ae65-dac64e746079 | approved |
| buildings/store v1 (atap melayang) | 000a6196-b86e-46c6-ae1e-7e7858c77dd2 | rejected |
| buildings/store v2 | 85500d41-d4f7-4220-8220-278fcda6b2d2 | approved |
| buildings/blacksmith (gap atap dirapatkan Python) | a2930219-e799-4b16-9fb3-d59f19aa0075 | approved |
| buildings/warung v1, v2 (isometrik) | 5241d450…, 5520b385… | rejected |
| buildings/town_props (papan, air mancur, lampu) | bd96b655-268b-40f1-85ad-ddb4f6abae4d | approved |
| nature/pine + bridge | d009c895-f30f-44c6-be15-fb911663ce30 | approved |
| terrain/sand | 57d8665b-89aa-43dd-b044-bf1e3f8d0518 | approved |
| terrain/plaza | a5995d95-0882-4ce2-8ef6-e0a3abf9c8d3 | approved |
| terrain/wood_floor + wall | ba56b10d-16e1-490b-8cd9-0b1a5983329f | approved |
| interior/furniture (8) | f24d4015-7740-4efd-bcf5-5dd50f60a27e | approved |
| interior/shop_props (4) | c6e7f0f2-fdc5-450e-b71d-575a90798cce | approved |
| fx/particles (8) | c2a27f8a-3ea1-43e2-b456-6b8b3a3f40cb | approved |
| homepage/hero key art | 25afcd28-47d1-4362-b18c-3425beeb7f59 | approved |
| homepage/logo | 2aaf9d98-0dc5-4637-874c-ec5ec270999d | approved |
| homepage/ornaments (sign, divider dipakai) | 0538a6a2-a882-4180-904b-94253465e9d7 | approved |

Pelajaran tambahan: (1) beberapa bangunan digambar dengan atap melayang terpisah dari dinding -> `tools/collapse_gaps.py` merapatkan baris transparan di dalam objek; (2) prompt bangunan harus menegaskan "roof eave TOUCHES the top edge of the wall, one continuous shape"; (3) untuk gaya yang sulit (warung), lampirkan bangunan yang sudah disetujui sebagai referensi sudut pandang.
""")
