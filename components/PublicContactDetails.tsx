"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { siteConfig } from "@/lib/siteConfig";

type PublicContact = {
  email: string;
  phone: string;
  address: string;
};

const fallbackContact: PublicContact = {
  email: siteConfig.contact.email,
  phone: "",
  address: siteConfig.contact.address || "Odisha",
};

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function usePublicContact() {
  const [contact, setContact] = useState<PublicContact>(fallbackContact);

  useEffect(() => {
    getDoc(doc(db, "siteSettings", "main"))
      .then((snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        setContact((current) => ({
          email: readText(data.email) || current.email,
          phone: readText(data.phone) || current.phone,
          address: readText(data.address) || current.address,
        }));
      })
      .catch((error) => {
        console.warn("Public contact settings unavailable; using safe defaults", error);
      });
  }, []);

  return contact;
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
