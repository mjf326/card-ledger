import { TransactionProvider } from "@/context/TransactionContext";
import Ledger from "@/pages/Ledger";

const Index = () => (
  <TransactionProvider>
    <Ledger />
  </TransactionProvider>
);

export default Index;
