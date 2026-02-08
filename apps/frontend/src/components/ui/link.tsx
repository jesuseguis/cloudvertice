'use client'

import * as React from 'react'
import NextLink from 'next/link'
import { cn } from '@/lib/utils/cn'

const Link = React.forwardRef<
  React.ElementRef<typeof NextLink>,
  React.ComponentPropsWithoutRef<typeof NextLink>
>(({ className, ...props }, ref) => (
  <NextLink
    ref={ref}
    className={cn('transition-colors hover:text-primary', className)}
    {...props}
  />
))
Link.displayName = 'Link'

export { Link }
