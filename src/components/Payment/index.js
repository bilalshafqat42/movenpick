import { getSectionContent, buildDefaultsFromFields } from "@/lib/content";
import { fieldDefault } from "@/lib/section-defaults";
import { PAYMENT_FIELDS } from "@/content/sections/payment";
import PaymentClient from "./PaymentClient";

export default async function Payment() {
  const content = await getSectionContent(
    "payment",
    buildDefaultsFromFields(PAYMENT_FIELDS),
  );

  return (
    <PaymentClient
      eyebrow={content.eyebrow}
      heading={content.heading}
      planNumber1={content["plan-number-1"]}
      planNumber2={content["plan-number-2"]}
      planLabel1={content["plan-label-1"]}
      planLabel2={content["plan-label-2"]}
      image={content.image}
      imageFallback={fieldDefault(PAYMENT_FIELDS, "image")}
      imageAlt={content["image-alt"]}
      brochureButtonLabel={content["brochure-button-label"]}
      brochureUrl={content["brochure-url"]}
      submitButtonLabel={content["submit-button-label"]}
    />
  );
}
