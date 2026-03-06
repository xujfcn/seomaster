
@cli.command()
@click.argument('markdown_file', type=click.Path(exists=True))
@click.option('--dry-run', is_flag=True, help='Preview without generating images')
def add_images(markdown_file, dry_run):
    """为文章添加配图（每篇最多3张）"""
    from auto_image import add_images_to_markdown
    
    github_token = os.getenv("GITHUB_TOKEN")
    github_repo = os.getenv("GITHUB_REPO")
    github_branch = os.getenv("GITHUB_BRANCH", "main")
    
    if not github_token or not github_repo:
        click.echo("Error: GITHUB_TOKEN and GITHUB_REPO must be set in .env", err=True)
        return
    
    success = add_images_to_markdown(
        markdown_file,
        github_token,
        github_repo,
        github_branch,
        max_images=3,
        dry_run=dry_run
    )
    
    if success:
        click.echo(f"✓ Images added to {markdown_file}")
    else:
        click.echo(f"✗ Failed to add images", err=True)
