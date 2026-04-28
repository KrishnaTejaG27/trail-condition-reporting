import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500" />;
    if (theme === 'dark') return <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400" />;
    return <Monitor className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Light';
    if (theme === 'dark') return 'Dark';
    return 'System';
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3"
    >
      {getIcon()}
      <span className="text-xs hidden md:inline">{getLabel()}</span>
      <span className="sr-only">Toggle theme (currently {theme})</span>
    </Button>
  );
}
