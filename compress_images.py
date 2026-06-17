"""
图片批量压缩脚本（直接替换原图）
用法：python compress_images.py
"""

import os
from PIL import Image

# 配置
IMAGES_DIR = "images"  # 图片目录
MAX_WIDTH = 1920  # 最大宽度
QUALITY = 85  # 压缩质量 (1-100)

def main():
    """主函数"""
    # 统计
    total_original = 0
    total_compressed = 0
    count = 0
    errors = 0

    print("=" * 60)
    print("图片批量压缩工具（直接替换）")
    print("=" * 60)
    print(f"图片目录: {IMAGES_DIR}")
    print(f"最大宽度: {MAX_WIDTH}px")
    print(f"压缩质量: {QUALITY}%")
    print("=" * 60)

    # 遍历所有图片
    for root, dirs, files in os.walk(IMAGES_DIR):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                filepath = os.path.join(root, file)

                print(f"\n处理: {filepath}")

                # 获取原始大小
                original_size = os.path.getsize(filepath)

                # 压缩并替换
                try:
                    with Image.open(filepath) as img:
                        width, height = img.size

                        # 如果宽度超过最大值，等比缩小
                        if width > MAX_WIDTH:
                            ratio = MAX_WIDTH / width
                            new_height = int(height * ratio)
                            img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

                        # 保存压缩后的图片（替换原图）
                        img.save(filepath, "JPEG", quality=QUALITY, optimize=True)

                    # 获取压缩后大小
                    compressed_size = os.path.getsize(filepath)
                    ratio = (1 - compressed_size / original_size) * 100

                    total_original += original_size
                    total_compressed += compressed_size
                    count += 1

                    print(f"  {original_size / 1024 / 1024:.2f} MB → {compressed_size / 1024 / 1024:.2f} MB (减少 {ratio:.1f}%)")

                except Exception as e:
                    print(f"  错误: {e}")
                    errors += 1

    # 汇总
    print("\n" + "=" * 60)
    print("压缩完成!")
    print("=" * 60)
    print(f"处理图片: {count} 张")
    print(f"处理失败: {errors} 张")
    print(f"原始大小: {total_original / 1024 / 1024:.2f} MB")
    print(f"压缩大小: {total_compressed / 1024 / 1024:.2f} MB")
    print(f"节省空间: {(1 - total_compressed / total_original) * 100:.1f}%")

if __name__ == "__main__":
    main()
