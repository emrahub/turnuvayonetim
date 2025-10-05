import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { BRAND } from '../lib/brand';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Templates', href: '/templates' },
        { name: 'Updates', href: '/updates' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Team', href: '/team' },
        { name: 'Careers', href: '/careers' },
        { name: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Documentation', href: '/docs' },
        { name: 'Help Center', href: '/help' },
        { name: 'Community', href: '/community' },
        { name: 'Status', href: '/status' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'Licenses', href: '/licenses' },
      ],
    },
  ];

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Email', icon: Mail, href: 'mailto:hello@rangenex.com' },
  ];

  return (
    <footer className="border-t border-slate-700/50 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top Section */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/rangenex-logo.svg"
                alt="RangeNex"
                width={180}
                height={45}
                className="h-12 w-auto"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">
              {BRAND.description}
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="rounded-lg p-2 text-slate-400 transition-smooth hover:bg-slate-800 hover:text-brand-400"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="icon-md" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-slate-200">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-smooth hover:text-brand-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-slate-700/50 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              © {currentYear} {BRAND.name}. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Built with ❤️ for poker professionals
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
