import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  countryCode: string;
  abbreviation: string;
}

const languages: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    countryCode: 'US',
    abbreviation: 'us'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    countryCode: 'SA',
    abbreviation: 'ar'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    countryCode: 'FR',
    abbreviation: 'fr'
  }
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    
    // Update document direction and language
    const isRTL = languageCode === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = languageCode;
    
    // Update body class for RTL styling
    document.body.classList.toggle('rtl', isRTL);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <ReactCountryFlag
            countryCode={currentLanguage.countryCode}
            svg
            style={{
              width: '1.25em',
              height: '1.25em',
            }}
            title={currentLanguage.name}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ReactCountryFlag
                countryCode={language.countryCode}
                svg
                style={{
                  width: '1.25em',
                  height: '1.25em',
                }}
                title={language.name}
              />
              <span className="text-sm font-medium">{language.nativeName}</span>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
