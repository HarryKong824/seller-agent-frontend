import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token');

  if (!token?.value) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
