import Header from './Header';
import Footer from './Footer';

export default function PaperLayout({ children, active, headerRight, withNav = true, withFooter = true, gap = 'gap-8 lg:gap-10', padding = 'pt-7 pb-12' }) {
  return (
    <div className="paper-grid relative flex min-h-dvh flex-col font-body text-ink-dark">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-18 hidden w-0.5 bg-pen/35 md:block" />
      <div className={`relative mx-auto flex w-full max-w-340 flex-[1_0_auto] flex-col px-4 md:pr-6 md:pl-26 ${padding} ${gap}`}>
        <Header active={active} right={headerRight} withNav={withNav} />
        {children}
      </div>
      {withFooter && <Footer />}
    </div>
  );
}
