export default function Footer() {
  return (
    <div className="absolute w-full border-t border-gray-200 bg-white py-5 text-center">
      <p className="text-gray-500">
        A web3 dApp by{" "}
        <a
          className="font-medium text-gray-800 underline transition-colors"
          href="https://twitter.com/maskeddao"
          target="_blank"
          rel="noopener noreferrer">
          MaskedDAO
        </a>
      </p>
      <p className="text-gray-500">
        For technical support please open a ticket in our{" "}
        <a
          className="font-medium text-gray-800 underline transition-colors"
          href="https://discord.com/invite/bNqTtnhWUh"
          target="_blank"
          rel="noopener noreferrer">
          Discord
        </a>
        🏥
      </p>
    </div>
  );
}
