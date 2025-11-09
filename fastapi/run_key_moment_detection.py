"""
Run key moment detection on synchronized audio and event streams.
"""
import asyncio
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.modules.key_moment_detector import process_streams_for_key_moments, KeyMomentDetector


async def main():
    """Run key moment detection."""
    print("="*60)
    print("KEY MOMENT DETECTION")
    print("="*60)
    print("Processing synchronized audio and event streams...")
    print("Looking for high-criticality plays and exciting audio moments\n")
    
    # Run detection at 100x speed
    key_moments = await process_streams_for_key_moments(
        speed=50.0,
        audio_weight=0.2,
        play_weight=0.8,
        key_moment_threshold=45.0  # Lower threshold to catch more moments
    )
    
    # Print summary
    print("\n" + "="*60)
    print(f"DETECTION COMPLETE - Found {len(key_moments)} key moments")
    print("="*60)
    
    # Show top 10 moments
    detector = KeyMomentDetector()
    detector.detected_moments = key_moments
    top_moments = detector.get_top_moments(n=10)
    
    print("\n🏆 TOP 10 KEY MOMENTS:")
    print("-"*60)
    for i, moment in enumerate(top_moments, 1):
        print(f"\n{i}. Time: {moment.timestamp:.1f}s (Q{moment.play_data.get('quarter')})")
        print(f"   Combined Score: {moment.combined_score:.1f}")
        print(f"   Play: {moment.play_score:.1f} ({moment.play_category})")
        print(f"   Audio: {moment.audio_score:.1f}")
        print(f"   {moment.play_data.get('Description', 'N/A')}")
    
    # Export to file
    summary = detector.export_moments_summary()
    import json
    with open('key_moments_detected.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✅ Exported {len(summary)} key moments to 'key_moments_detected.json'")


if __name__ == "__main__":
    asyncio.run(main())
