import Header from './Header';
import Footer from './Footer';

export default function PaperLayout({ children, active, headerRight, withNav = true, withFooter = true, gap = 'gap-8 lg:gap-10' }) {
  return (
    <div className="paper-grid relative flex min-h-screen flex-col font-body text-ink-dark">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[72px] hidden w-0.5 bg-pen/35 sm:block" />
      <div className={`relative mx-auto flex w-full max-w-[1200px] flex-[1_0_auto] flex-col px-4 pt-7 pb-12 sm:pr-6 sm:pl-[104px] ${gap}`}>
        <Header active={active} right={headerRight} withNav={withNav} />
        {children}
      </div>
      {withFooter && <Footer />}
    </div>
  );
}
