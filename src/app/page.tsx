import MaxWidthWrapper from "@/components/max-width-wrapper";
import ViewChirps from "@/components/view-chirps";
import ChirpForm from "@/components/chirp-form";

export default async function Home() {
  return (
    <MaxWidthWrapper className="flex flex-col gap-4">
      <ChirpForm />
      <ViewChirps />
    </MaxWidthWrapper>
  );
}
