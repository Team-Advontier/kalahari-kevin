// pages/index.tsx
// This is the main page of the application.
// It contains the main components and logic for the application.


import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '../styles/Home.module.css'
import { SearchDialog } from '@/components/SearchDialog'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { TicketUpload } from '@/components/TicketUpload'
import { flattenTickets, FlattenedTicket } from '@/components/flattenTickets';
import { TicketTable } from '@/components/TicketTable';
import { ExportToolbar } from '@/components/ExportToolbar';
import { ArticleUploader } from '@/components/data-uploaders/ArticleUploader';
import { CategoryUploader } from '@/components/data-uploaders/CategoryUploader';
import { CompanyUploader } from '@/components/data-uploaders/CompanyUploader';
import { CustomerUploader } from '@/components/data-uploaders/CustomerUploader';
import { StatusUploader } from '@/components/data-uploaders/StatusUploader';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const [view, setView] = React.useState<'tickets' | 'articles' | 'categories' | 'companies' | 'customers' | 'statuses'>('tickets');
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [flatTickets, setFlatTickets] = React.useState<FlattenedTicket[]>([]);

  React.useEffect(() => {
    setFlatTickets(flattenTickets(tickets));
  }, [tickets]);

  return (
    <>
      <Head>
        <title>Next.js OpenAI Template</title>
        <meta
          name="description"
          content="Next.js Template for building OpenAI applications with Supabase."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className="w-full flex flex-col items-center">
          <div className="flex gap-4 mb-6">
            <button
              className={`px-4 py-2 rounded font-semibold border ${view === 'tickets' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              onClick={() => setView('tickets')}
            >
              Upload Tickets
            </button>
            <button
              className={`px-4 py-2 rounded font-semibold border ${view === 'articles' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              onClick={() => setView('articles')}
            >
              Upload Articles (Teamwork Desk)
            </button>
            <button
              className={`px-4 py-2 rounded font-semibold border ${view === 'categories' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              onClick={() => setView('categories')}
            >
              Upload Categories (Teamwork Desk)
            </button>
            <button
              className={`px-4 py-2 rounded font-semibold border ${view === 'companies' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              onClick={() => setView('companies')}
            >
              Upload Companies (Teamwork Desk/Projects)
            </button>
            <button
              className={`px-4 py-2 rounded font-semibold border ${view === 'customers' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              onClick={() => setView('customers')}
            >
              Upload Customers (Teamwork Desk)
            </button>
            <button
              className={`px-4 py-2 rounded font-semibold border ${view === 'statuses' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
              onClick={() => setView('statuses')}
            >
              Upload Statuses (Teamwork Desk)
            </button>
          </div>
          {view === 'tickets' ? (
            <>
              <TicketUpload onTicketsParsed={setTickets} />
              {flatTickets.length > 0 && (
                <>
                  <div className="mt-4 text-green-700 font-semibold">Parsed {flatTickets.length} unique tickets.</div>
                  <div className="w-full mt-6">
                    <ExportToolbar tickets={flatTickets} />
                    <TicketTable tickets={flatTickets} onTicketsChange={setFlatTickets} />
                  </div>
                </>
              )}
            </>
          ) : view === 'articles' ? (
            <ArticleUploader />
          ) : view === 'categories' ? (
            <CategoryUploader />
          ) : view === 'companies' ? (
            <CompanyUploader />
          ) : view === 'customers' ? (
            <CustomerUploader />
          ) : (
            <StatusUploader />
          )}
        </div>
        <div className={styles.center}>
          <SearchDialog />
        </div>
        <div className="py-8 w-full flex items-center justify-center space-x-6">
          <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
            <Link href="https://supabase.com" className="flex items-center justify-center">
              <p className="text-base mr-2">Built by Supabase</p>
              <Image src={'/supabase.svg'} width="20" height="20" alt="Supabase logo" />
            </Link>
          </div>
          <div className="border-l border-gray-300 w-1 h-4" />
          <div className="flex items-center justify-center space-x-4">
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://github.com/supabase/supabase"
                className="flex items-center justify-center"
              >
                <Image src={'/github.svg'} width="20" height="20" alt="Github logo" />
              </Link>
            </div>
            <div className="opacity-75 transition hover:opacity-100 cursor-pointer">
              <Link
                href="https://twitter.com/supabase"
                className="flex items-center justify-center"
              >
                <Image src={'/twitter.svg'} width="20" height="20" alt="Twitter logo" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
