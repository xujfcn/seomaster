"""
自动配图模块 - 为文章添加相关配图
"""
import os
import re
import base64
import requests
from typing import List, Tuple
from openai import OpenAI

def generate_image_prompt(section_text: str, article_title: str) -> str:
    """根据文章段落生成图片提示词"""
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    )
    
    prompt = f"""
Based on this article section, generate a concise image prompt (max 100 words) for DALL-E:

Article Title: {article_title}
Section: {section_text[:500]}

Requirements:
- Professional, clean style
- Relevant to the content
- Suitable for a tech blog
- No text in image

Return only the image prompt, nothing else.
"""
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    
    return response.choices[0].message.content.strip()

def generate_image(prompt: str) -> bytes:
    """使用 DALL-E 生成图片"""
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    )
    
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1
    )
    
    image_url = response.data[0].url
    image_data = requests.get(image_url).content
    return image_data

def upload_to_github(
    image_data: bytes,
    filename: str,
    github_token: str,
    github_repo: str,
    github_branch: str = "main"
) -> str:
    """上传图片到 GitHub 仓库"""
    url = f"https://api.github.com/repos/{github_repo}/contents/images/{filename}"
    
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    content_base64 = base64.b64encode(image_data).decode()
    
    data = {
        "message": f"Add image: {filename}",
        "content": content_base64,
        "branch": github_branch
    }
    
    response = requests.put(url, headers=headers, json=data)
    response.raise_for_status()
    
    return response.json()["content"]["download_url"]

def find_image_positions(content: str, max_images: int = 3) -> List[Tuple[int, str]]:
    """找到适合插入图片的位置（每篇文章最多3张）"""
    lines = content.split('\n')
    positions = []
    
    # 跳过 frontmatter
    in_frontmatter = False
    start_idx = 0
    for i, line in enumerate(lines):
        if line.strip() == '---':
            if not in_frontmatter:
                in_frontmatter = True
            else:
                start_idx = i + 1
                break
    
    # 找到主要的二级标题位置
    for i in range(start_idx, len(lines)):
        line = lines[i]
        if line.startswith('## ') and not line.startswith('###'):
            # 获取这个段落的内容（用于生成图片提示词）
            section_text = []
            for j in range(i+1, min(i+10, len(lines))):
                if lines[j].startswith('#'):
                    break
                section_text.append(lines[j])
            
            positions.append((i, '\n'.join(section_text)))
            
            if len(positions) >= max_images:
                break
    
    return positions

def add_images_to_markdown(
    markdown_file: str,
    github_token: str,
    github_repo: str,
    github_branch: str = "main",
    max_images: int = 3,
    dry_run: bool = False
) -> bool:
    """为 Markdown 文章添加配图（每篇最多3张）"""
    
    with open(markdown_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取文章标题
    title_match = re.search(r'^title:\s*["\']?(.+?)["\']?\s*$', content, re.MULTILINE)
    article_title = title_match.group(1) if title_match else "Article"
    
    # 找到插入位置
    positions = find_image_positions(content, max_images)
    
    if not positions:
        print(f"No suitable positions found in {markdown_file}")
        return False
    
    print(f"Found {len(positions)} positions for images (max {max_images})")
    
    if dry_run:
        print("Dry run mode - no images will be generated")
        return True
    
    # 从后往前插入，避免位置偏移
    lines = content.split('\n')
    base_filename = os.path.splitext(os.path.basename(markdown_file))[0]
    
    for idx, (line_num, section_text) in enumerate(reversed(positions)):
        try:
            print(f"\nGenerating image {idx+1}/{len(positions)}...")
            
            # 生成图片提示词
            image_prompt = generate_image_prompt(section_text, article_title)
            print(f"Prompt: {image_prompt[:100]}...")
            
            # 生成图片
            image_data = generate_image(image_prompt)
            
            # 上传到 GitHub
            filename = f"{base_filename}-{len(positions)-idx}.png"
            image_url = upload_to_github(
                image_data, filename, github_token, github_repo, github_branch
            )
            
            # 插入图片
            lines.insert(line_num + 1, f"\n![{article_title}]({image_url})\n")
            print(f"✓ Image added: {image_url}")
            
        except Exception as e:
            print(f"✗ Failed to add image: {e}")
            continue
    
    # 保存文件
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    print(f"\n✓ Successfully added images to {markdown_file}")
    return True

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python auto_image.py <markdown_file> [--dry-run]")
        sys.exit(1)
    
    markdown_file = sys.argv[1]
    dry_run = "--dry-run" in sys.argv
    
    github_token = os.getenv("GITHUB_TOKEN")
    github_repo = os.getenv("GITHUB_REPO")
    github_branch = os.getenv("GITHUB_BRANCH", "main")
    
    if not github_token or not github_repo:
        print("Error: GITHUB_TOKEN and GITHUB_REPO must be set")
        sys.exit(1)
    
    add_images_to_markdown(
        markdown_file,
        github_token,
        github_repo,
        github_branch,
        max_images=3,
        dry_run=dry_run
    )
