import { Hero } from './landing/sections/Hero';
import {FeaturedTasks} from './landing/sections/FeauturedTasks'
import { HowItWorks } from './landing/sections/HowItWorks';
import { RoleSplit } from './landing/sections/RoleSplit';
import {ProofBlock} from './landing/sections/ProofBlock'
import {FinalCta} from './landing/sections/FinalCta'
export function Landing() {
  return (
    <>
      <Hero />
      <FeaturedTasks />
      <HowItWorks />
      <RoleSplit />
      <ProofBlock />
      <FinalCta />
    </>
  );
}