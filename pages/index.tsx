// pages/index.tsx
// This is the main page of the application.
// It contains the main components and logic for the application.


import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '../styles/Home.module.css'
import { SearchDialog } from '@/components/SearchDialog'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { TicketUpload } from '@/components/TicketUpload'
import { flattenTickets, FlattenedTicket } from '@/components/flattenTickets';
import { TicketTable } from '@/components/TicketTable';
import { ExportToolbar } from '@/components/ExportToolbar';
import { ArticleUploader } from '@/components/data-uploaders/ArticleUploader';
import { CategoryUploader } from '@/components/data-uploaders/CategoryUploader';
import { CompanyUploader } from '@/components/data-uploaders/CompanyUploader';
import { CustomerUploader } from '@/components/data-uploaders/CustomerUploader';
import { StatusUploader } from '@/components/data-uploaders/StatusUploader';
import { TypeUploader } from '@/components/data-uploaders/TypeUploader';
import { AgentUploader } from '@/components/data-uploaders/AgentUploader';
import { ProjectUploader } from '@/components/data-uploaders/ProjectUploader';
import { TaskUploader } from '@/components/data-uploaders/TaskUploader';
import { XeroInvoiceUploader } from '@/components/data-uploaders/XeroInvoiceUploader';
import { XeroContactUploader } from '@/components/data-uploaders/XeroContactUploader';
import { XeroQuoteUploader } from '@/components/data-uploaders/XeroQuoteUploader';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  // Use null for fallback view
  const [view, setView] = useState<
    | null
    | 'tickets'
    | 'articles'
    | 'categories'
    | 'customers'
    | 'statuses'
    | 'types'
    | 'agents'
    | 'companies'
    | 'projects'
    | 'tasks'
    | 'xeroInvoices'
    | 'xeroContacts'
    | 'xeroQuotes'
  >(null);
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
          {/* Teamwork Desk Group */}
          <div className="w-full max-w-5xl mb-2">
            <div className="font-bold text-lg mb-1 mt-4">Teamwork Desk Objects</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'tickets' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('tickets')}
              >
                Upload Tickets <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'articles' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('articles')}
              >
                Upload Articles <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'categories' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('categories')}
              >
                Upload Categories <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'customers' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('customers')}
              >
                Upload Customers <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'statuses' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('statuses')}
              >
                Upload Statuses <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'types' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('types')}
              >
                Upload Ticket Types <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'agents' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('agents')}
              >
                Upload Agents <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
            </div>
          </div>
          {/* Teamwork Projects Group */}
          <div className="w-full max-w-5xl mb-2">
            <div className="font-bold text-lg mb-1 mt-4">Teamwork Project Objects</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'companies' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('companies')}
              >
                Upload Companies <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'projects' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('projects')}
              >
                Upload Projects (Excel) <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'tasks' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('tasks')}
              >
                Upload Tasks (Excel) <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">upsert</span>
              </button>
              {/* Add more Teamwork Projects tabs here as needed */}
            </div>
          </div>
          {/* Xero Group */}
          <div className="w-full max-w-5xl mb-2">
            <div className="font-bold text-lg mb-1 mt-4">Xero Accounting Objects</div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'xeroContacts' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('xeroContacts')}
              >
                Upload Xero Contacts
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'xeroInvoices' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('xeroInvoices')}
              >
                Upload Xero Invoices
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold border ${view === 'xeroQuotes' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setView('xeroQuotes')}
              >
                Upload Xero Quotes
              </button>
            </div>
          </div>
          {/* Main panel: uploader or fallback */}
          <div className="w-full max-w-5xl mt-4">
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
            ) : view === 'projects' ? (
              <ProjectUploader />
            ) : view === 'tasks' ? (
              <TaskUploader />
            ) : view === 'customers' ? (
              <CustomerUploader />
            ) : view === 'statuses' ? (
              <StatusUploader />
            ) : view === 'types' ? (
              <TypeUploader />
            ) : view === 'agents' ? (
              <AgentUploader />
            ) : view === 'xeroInvoices' ? (
              <XeroInvoiceUploader />
            ) : view === 'xeroContacts' ? (
              <XeroContactUploader />
            ) : view === 'xeroQuotes' ? (
              <XeroQuoteUploader />
            ) : (
              <div className="bg-slate-50 border rounded p-8 text-center text-slate-700 text-lg mt-8">
                <div className="mb-2 font-bold text-xl">Welcome to the Data Ingestion Dashboard</div>
                <div>Select a data source and object type above to begin uploading and syncing your data.</div>
              </div>
            )}
          </div>
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
