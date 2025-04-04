  {/* Navigation Links */}
  <div className="pt-2 pb-4 space-y-1">
    <SidebarLink href="/" text="Home" icon={<HomeIcon />} active={router.pathname === '/'} />
    <SidebarLink
      href="/sampler"
      text="CPU Sampler"
      icon={<ChipIcon />}
      active={router.pathname.includes('/sampler')}
    />
    <SidebarLink
      href="/heap"
      text="Heap"
      icon={<DatabaseIcon />}
      active={router.pathname.includes('/heap')}
    />
    <SidebarLink
      href="/methodcalls"
      text="Method Calls"
      icon={<CalculatorIcon />}
      active={router.pathname.includes('/methodcalls')}
    />
  </div> 