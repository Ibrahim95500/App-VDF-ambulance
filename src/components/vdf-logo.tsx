export function VdfLogo({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={className} width="100%" height="100%">
            <defs>
                <style dangerouslySetInnerHTML={{
                    __html: `
          .vdf-bg-blue { fill: #2c3e8a; }
          .vdf-outline-shape { stroke: transparent; stroke-width: 0; }
          .vdf-border-blue { stroke: #2c3e8a; stroke-width: 2; }
          .vdf-text-orange { fill: #f27124; font-family: 'Georgia', serif; font-size: 56px; font-weight: bold; text-anchor: middle; letter-spacing: 2px; }
        `}} />
            </defs>
            <g className="vdf-outline-shape">
                <g className="vdf-border-blue">
                    <rect x="75" y="10" width="50" height="180" className="vdf-bg-blue" rx="3" />
                    <rect x="75" y="10" width="50" height="180" className="vdf-bg-blue" rx="3" transform="rotate(60 100 100)" />
                    <rect x="75" y="10" width="50" height="180" className="vdf-bg-blue" rx="3" transform="rotate(120 100 100)" />
                </g>
            </g>
            <text x="100" y="120" className="vdf-text-orange">VDF</text>
        </svg>
    );
}
