import { Container } from '../components/Container';
import { SectionHeading } from '../components/SectionHeading';

export function Stub({ title, note }: { title: string; note?: string }) {
  return (
    <Container className="py-24">
      <SectionHeading eyebrow="Coming soon" title={title} subline={note} />
    </Container>
  );
}