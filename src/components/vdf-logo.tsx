import { toAbsoluteUrl } from "@/lib/helpers";

export function VdfLogo({ className }: { className?: string }) {
    return (
        <img 
            src={toAbsoluteUrl('/media/app/logo.png')} 
            alt="VDF Logo" 
            className={className}
            style={{ objectFit: 'contain' }}
        />
    );
}
