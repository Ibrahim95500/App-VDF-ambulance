import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { I18N_LANGUAGES, Language } from '@/i18n/config';
import {
  BetweenHorizontalStart,
  Coffee,
  CreditCard,
  FileText,
  Globe,
  Moon,
  Settings,
  Shield,
  User,
  UserCircle,
  Users,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { changeLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();

  // Infer role from path if session role is missing or to stay in sync with current view
  const currentRole = (session?.user as any)?.role || (pathname.startsWith('/dashboard/rh') ? 'RH' : 'SALARIE');

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang.code);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            {(session?.user as any)?.image || (session?.user as any)?.avatar ? (
              <img src={(session?.user as any)?.image || (session?.user as any)?.avatar} className="w-9 h-9 border border-border rounded-full" alt="User avatar" />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full border border-primary/20">
                {session?.user.name?.charAt(0) || session?.user.email?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {session?.user.name || 'Utilisateur'}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {session?.user.email || ''}
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs bg-muted/20">
            {currentRole === 'RH' ? 'Administrateur RH' : 'Salarié'}
          </Badge>
        </div>

        <DropdownMenuSeparator />

        <div className="p-2">
          <DropdownMenuItem asChild className="mb-2 cursor-pointer">
            <Link href="/dashboard/profil" className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted dark:hover:bg-zinc-800 rounded-md">
              <UserCircle className="w-4 h-4 text-muted-foreground" />
              <span>Mon Profil</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted dark:hover:bg-zinc-800 rounded-md cursor-pointer">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <span>Affichage (Thème)</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                    🚑 VDF Origine (Base) / Sombre
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light" className="cursor-pointer">
                    ☀️ Clair
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </div>

        <DropdownMenuSeparator />

        <div className="p-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => signOut()}
          >
            Déconnexion
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
