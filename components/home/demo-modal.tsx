import Modal from "@/components/shared/modal";
import { useState, Dispatch, SetStateAction, useCallback, useMemo } from "react";
import Image from "next/image";

const DemoModal = ({ showDemoModal, setShowDemoModal }: { showDemoModal: boolean; setShowDemoModal: Dispatch<SetStateAction<boolean>> }) => {
  return (
    <Modal showModal={showDemoModal} setShowModal={setShowDemoModal}>
      <div className="w-full overflow-hidden md:max-w-md md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
          <Image src="/gibi2.png" alt="GIBI Logo" width={100} height={100} />
          <a href="https://gibi.app"></a>
          <h3 className="font-display text-2xl font-bold text-lime-500">
            You are now participating! the NFT will be automatically airdropped if you are the winner.
          </h3>
        </div>
      </div>
    </Modal>
  );
};

export function useDemoModal() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  const DemoModalCallback = useCallback(() => {
    return <DemoModal showDemoModal={showDemoModal} setShowDemoModal={setShowDemoModal} />;
  }, [showDemoModal, setShowDemoModal]);

  return useMemo(() => ({ setShowDemoModal, DemoModal: DemoModalCallback }), [setShowDemoModal, DemoModalCallback]);
}
