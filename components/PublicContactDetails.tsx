"use client";

import Link from "next/link";
import { usePublicSiteSettings } from "@/components/public/PublicSiteSettingsProvider";

function usePublicContact() {
  const settings = usePublicSiteSettings();

  return {
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
  };
}

export function PublicContactEmail() {
  const { email } = usePublicContact();

  if (!email) {
    return <Link href="/contact">Contact Us</Link>;
  }

  return <a href={`mailto:${email}`}>{email}</a>;
}

export default function PublicContactDetails() {
  const contact = usePublicContact();
  const phoneHref = contact.phone.replace(/[^\d+]/g, "");

  return (
    <div>
      <p>Location: {contact.address || "Odisha"}</p>

      <p>
        Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </p>

      {contact.phone ? (
        <p>
          Phone / WhatsApp:{" "}
          {phoneHref ? <a href={`tel:${phoneHref}`}>{contact.phone}</a> : contact.phone}
        </p>
      ) : null}
    </div>
  );
}
