import GridContainer from '@/components/GridContainer'
import GradientText from '@/components/buttons/GradientText'
import H2 from '@/components/headings/H2'
import { landingPageUrl } from 'consts'

export default function OurSponsors() {
  return (
    <section className='relative mt-32 lg:mt-10'>
      <div id='our-sponsors' className='absolute -top-24' />
      <GridContainer className='px-6'>
        <div className='col-span-full lg:col-span-6 flex flex-col gap-y-4 items-center lg:items-start lg:justify-center'>
          <H2>
            <span className='text-center'>Our sponsor</span>
          </H2>

          <div className='text-gray-100 tracking-[-0.002rem]'>This project is founded by Secret Network</div>
        </div>

        <div className='col-span-full lg:col-span-6 lg:col-start-7 flex flex-col gap-y-6 md:flex-row lg:flex-col md:mt-9 lg:pl-14 lg:py-6 lg:mt-0 lg:border-l-[1px] lg:border-[#455378]'>
          <div className='flex mt-11 md:mt-0 md:items-center justify-center lg:justify-start order-1 md:w-[40%] lg:w-full'>
            <div>
              <img src='/assets/secret-network.svg' alt='secret network logo' />
            </div>
          </div>

          <div className='flex flex-col gap-y-5 items-start order-2 md:w-[60%] lg:w-full md:pl-14 md:py-6 lg:p-0 md:border-0 md:border-l-[1px] md:border-[#455378] lg:border-0'>
            <div className='text-lg text-white font-space-grotesk font-bold'>Secret Network Grant Program</div>

            <div className='text-gray-100 tracking-[-0.002rem]'>
              This project exist thanks to Secret Network support
            </div>

            <a href={landingPageUrl.secretNetworkGrant} target='_blank' className='leading-[0]'>
              <GradientText>Visit webpage</GradientText>
            </a>
          </div>
        </div>
      </GridContainer>
    </section>
  )
}
