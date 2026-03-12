import Image from 'next/image';

export function VdfLogo({ className }: { className?: string }) {
    return (
        <div className={className}>
            <Image 
                src="/media/app/logo.png" 
                alt="VDF Ambulance Logo" 
                width={200} 
                height={200} 
                className="w-full h-full object-contain"
                priority
            />
        </div>
    );
}
