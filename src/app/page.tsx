import { redirect } from 'next/navigation'
// import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  // TEMPORARY: Skip auth check and go directly to dashboard
  // const { userId } = await auth()
  // if (userId) {
  //   redirect('/dashboard')
  // } else {
  //   redirect('/sign-in')
  // }
  
  redirect('/dashboard')
}
