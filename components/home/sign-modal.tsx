import Modal from "@/components/shared/modal";
import { useState, Dispatch, SetStateAction, useCallback, useMemo, CSSProperties } from "react";
import Image from "next/image";
import BarLoader from "react-spinners/BarLoader";
const DemoModal = ({
  showDemoModal,
  setShowDemoModal,
  modalText,
  hashText,
  loadingBar,
}: {
  showDemoModal: boolean;
  setShowDemoModal: Dispatch<SetStateAction<boolean>>;
  modalText: string; // Define the prop
  hashText: string;
  loadingBar: boolean;
}) => {
  return (
    <Modal showModal={showDemoModal} setShowModal={setShowDemoModal}>
      <div className="w-full overflow-hidden md:max-w-md md:rounded-2xl md:border md:border-gray-100 md:shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 bg-white px-4 py-6 pt-8 text-center md:px-16">
          <Image src="/gibi2.png" alt="GIBI Logo" width={100} height={100} />
          <a href="https://gibi.app"></a>
          <BarLoader loading={loadingBar} aria-label="Loading Spinner" data-testid="loader" color="green" />
          <h3 className="font-display font-bold text-lime-500">{modalText}</h3>
        </div>
      </div>
    </Modal>
  );
};

export function useCreateSIGNModal() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [hashText, setHashText] = useState("");
  const [loadingBar, setLoadingBar] = useState(true);
  const DemoModalCallback = useCallback(() => {
    return (
      <DemoModal
        showDemoModal={showDemoModal}
        setShowDemoModal={setShowDemoModal}
        modalText={modalText}
        hashText={hashText}
        loadingBar={loadingBar}
      />
    );
  }, [showDemoModal, setShowDemoModal, modalText, hashText, loadingBar]);

  return useMemo(
    () => ({ setShowDemoModal, DemoModal: DemoModalCallback, setModalText, setHashText, setLoadingBar, showDemoModal }),
    [setShowDemoModal, DemoModalCallback, setModalText, setHashText, setLoadingBar, showDemoModal]
  );
}
