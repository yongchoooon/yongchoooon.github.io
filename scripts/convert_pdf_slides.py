#!/usr/bin/env python3
"""Convert a portfolio PDF into per-page JPEG slides.

This script is a thin wrapper around the Poppler `pdftoppm` utility so that
updating `imgs/slides/*.jpg` stays consistent every time the portfolio PDF changes.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert a PDF into JPEG slide images using pdftoppm."
    )
    parser.add_argument(
        "pdf",
        type=Path,
        help="Path to the source PDF file",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("imgs/slides"),
        help="Directory to write slide images (default: imgs/slides)",
    )
    parser.add_argument(
        "--prefix",
        default="portfolio-page",
        help="Filename prefix for generated slides (default: portfolio-page)",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=150,
        help="Resolution in DPI for pdftoppm (default: 150)",
    )
    return parser.parse_args()


def ensure_tool(tool: str) -> None:
    if shutil.which(tool) is None:
        sys.exit(f"Error: required tool '{tool}' was not found in PATH. Install poppler-utils.")


def convert_pdf(pdf_path: Path, output_dir: Path, prefix: str, dpi: int) -> None:
    pdf_path = pdf_path.resolve()
    if not pdf_path.exists():
        sys.exit(f"Error: PDF file not found: {pdf_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    prefix_path = output_dir / prefix

    command = [
        "pdftoppm",
        "-jpeg",
        "-rx",
        str(dpi),
        "-ry",
        str(dpi),
        str(pdf_path),
        str(prefix_path),
    ]

    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as exc:
        sys.exit(f"pdftoppm failed with exit code {exc.returncode}")


def main() -> None:
    args = parse_args()
    ensure_tool("pdftoppm")
    convert_pdf(args.pdf, args.output_dir, args.prefix, args.dpi)
    print(
        f"Generated JPEG slides in {args.output_dir.resolve()} using prefix '{args.prefix}'."
    )


if __name__ == "__main__":
    main()
