import GirdContainer from '@/components/GridContainer'
import H2 from '@/components/headings/H2'
import { landingPageUrl } from 'consts'

export default function OurTeam() {
  return (
    <section className='relative mt-32'>
      <div id='our-team' className='absolute -top-24' />

      <GirdContainer className='px-6'>
        <div className='col-span-full lg:col-start-3 lg:col-span-8 flex flex-col text-center gap-y-4 md:gap-y-6'>
          <H2>
            <span className='text-center'>
              Team{' '}
              <a href={landingPageUrl.atomikLabs} target='_self' className='gradient-text'>
                atomiklabs
              </a>
            </span>
          </H2>

          <div className='text-gray-100 tracking-[-0.002rem]'>Feel free to reach out and share your thoughts!</div>
        </div>
      </GirdContainer>
    </section>
  )
}
