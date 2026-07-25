'use client';

import NextError from 'next/error';

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  console.error('Global error:', error);

  return (
    <html lang='zh-CN'>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
