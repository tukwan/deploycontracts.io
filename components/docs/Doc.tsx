// @ts-nocheck
import React from 'react'
import { CopyBlock, atomOneDark } from 'react-code-blocks'

import { FormButton, FormWithSinger } from '@/components/form'

export default function Doc({
  name,
  secretClient,
  onSubmit,
  output,
  codeBlock,
  text,
  inputName = '',
  inputPlaceholder = '',
  inputName2 = '',
  inputPlaceholder2 = '',
  refScroll,
}) {
  return (
    <section ref={refScroll} className='mb-20'>
      <h3 className='text-white text-lg'>{name}</h3>
      <p className='text-slate-400 text-sm leading-6 my-6'>{text}</p>

      <CopyBlock
        text={codeBlock}
        theme={atomOneDark}
        language='ts'
        wrapLines
        customStyle={{ overflowWrap: 'break-word', fontSize: '1rem', padding: '1rem' }}
      />

      <FormWithSinger name={name} disabled={secretClient.isReadOnly} onSubmit={onSubmit}>
        <p className='text-sm text-slate-400 mb-3'>
          <strong className='text-white'>Copy-paste the code snippet</strong> into the developer console, or{' '}
          <strong className='text-white'>use the form</strong> below:
        </p>

        <p>
          {inputName && (
            <input
              type='text'
              name={inputName}
              id={inputName}
              placeholder={inputPlaceholder}
              required
              className='mb-3 mr-2 input py-4 px-5 bg-[#000B28] text-base border-2 border-[#455378] rounded-2xl text-gray-100 placeholder:text-gray-300 visited:border-[#6075AA]'
            />
          )}
          {inputName2 && (
            <input
              type='text'
              name={inputName2}
              id={inputName2}
              placeholder={inputPlaceholder2}
              required
              className='mb-3 input py-4 px-5 bg-[#000B28] text-base border-2 border-[#455378] rounded-2xl text-gray-100 placeholder:text-gray-300 visited:border-[#6075AA]'
            />
          )}
        </p>
        <FormButton className={'max-w-xs'}>{name}</FormButton>
      </FormWithSinger>

      {output && (
        <div className='mb-5 prose prose-slate max-w-none prose-invert text-slate-400'>
          <h4 className='text-white my-3'>Output:</h4>
          <pre className='rounded-xl bg-slate-900 shadow-lg bg-slate-800/60 shadow-none ring-1 ring-slate-300/10'>
            <output>{output}</output>
          </pre>
        </div>
      )}
    </section>
  )
}
