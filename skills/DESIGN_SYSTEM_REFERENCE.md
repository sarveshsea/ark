# Design System Reference — Cross-Industry Component Gallery

## Purpose
Master index of real-world design system implementations across 100+ organizations. Each component links to its live documentation in production design systems. Use this to benchmark, audit, research patterns, and scaffold components with awareness of how the industry builds them.

## When to Load
- Auditing a design system for completeness or best practices
- Researching how a specific component is implemented across systems
- Writing component specs that need industry-standard prop APIs
- Comparing interaction patterns (e.g. "how do others handle accordion nesting?")
- Building a new component and need reference implementations
- Answering "who has a good X component?"

## How Agents Should Use This
1. **Spec scaffolding** — When creating a component spec, look up the component here. Cross-reference 3-5 top systems (shadcn, Radix, Headless UI, Carbon, Spectrum) to identify consensus props, states, and accessibility patterns.
2. **Audit gaps** — Compare a project's component list against the categories below to find missing primitives.
3. **Pattern research** — If a user asks "how should X work?", sample 5-8 implementations from this list to identify the dominant pattern.
4. **Naming alignment** — Use the component names here as canonical. If a system calls it "Collapse" but most call it "Accordion", prefer "Accordion".

## Key Systems (Tier 1 — reference these first)
| System | Org | Stack | URL Pattern |
|--------|-----|-------|-------------|
| shadcn/ui | Community | React + Tailwind | ui.shadcn.com |
| Radix Primitives | WorkOS | React headless | radix-ui.com |
| Headless UI | Tailwind Labs | React/Vue headless | headlessui.com |
| Spectrum | Adobe | React | spectrum.adobe.com |
| Carbon | IBM | React/Web Components | carbondesignsystem.com |
| Polaris | Shopify | React | polaris.shopify.com |
| Primer | GitHub | React | primer.style |
| Lightning | Salesforce | Web Components | lightningdesignsystem.com |
| Fluent UI | Microsoft | React | developer.microsoft.com/fluentui |
| Ant Design | Ant Group | React | ant.design |
| Atlassian DS | Atlassian | React | atlassian.design |
| Chakra UI | Community | React | chakra-ui.com |
| Material 3 | Google | Various | m3.material.io |
| PatternFly | Red Hat | React | patternfly.org |
| Geist | Vercel | React | vercel.com/geist |
| GOV.UK | UK Gov | Nunjucks | design-system.service.gov.uk |
| Hero UI | Community | React + Tailwind | heroui.com |
| Gestalt | Pinterest | React | gestalt.pinterest.systems |

---

## Components

### Accordion
Expandable/collapsible content sections. Also known as: Collapse, Disclosure, Expandable, Details, Toggle.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/accordion |
| shadcn/ui (Collapsible) | ui.shadcn.com/docs/components/collapsible |
| Radix | radix-ui.com/primitives/docs/components/accordion |
| Radix (Collapsible) | radix-ui.com/primitives/docs/components/collapsible |
| Headless UI | headlessui.com/react/disclosure |
| Ant Design | ant.design/components/collapse |
| Ariakit | ariakit.org/components/disclosure |
| Atlassian | — |
| Carbon | carbondesignsystem.com/components/accordion/usage/ |
| Chakra UI | chakra-ui.com/docs/components/accordion |
| Chakra UI (Collapsible) | chakra-ui.com/docs/components/collapsible |
| Spectrum | — |
| Polaris | — |
| Lightning | lightningdesignsystem.com/components/accordion/ |
| Lightning (Expandable) | lightningdesignsystem.com/components/expandable-section/ |
| Lightning (Summary) | lightningdesignsystem.com/components/summary-detail/ |
| Fluent UI | — |
| Material 3 | — |
| PatternFly | patternfly.org/components/accordion |
| PatternFly (Expandable) | patternfly.org/components/expandable-section |
| GOV.UK | design-system.service.gov.uk/components/accordion/ |
| GOV.UK (Details) | design-system.service.gov.uk/components/details/ |
| Geist | vercel.com/geist/collapse |
| Hero UI | heroui.com/docs/components/accordion |
| Gestalt | gestalt.pinterest.systems/web/accordion |
| Base Web | baseweb.design/components/accordion/ |
| Blueprint | blueprintjs.com/docs/#core/components/collapse |
| Bootstrap | getbootstrap.com/docs/4.3/components/collapse/ |
| Bolt | boltdesignsystem.com/pattern-lab/?p=viewall-components-accordion |
| Cauldron | cauldron.dequelabs.com/components/Accordion |
| Cedar | cedar.rei.com/components/accordion |
| Clarity | clarity.design/documentation/accordion |
| Decathlon | decathlon.design/726f8c765/p/04348b-accordion/b/228a62 |
| Dell | delldesignsystem.com/components/accordion/ |
| eBay (MindPatterns) | ebay.gitbook.io/mindpatterns/disclosure/accordion |
| eBay (Playbook) | playbook.ebay.com/design-system/components/expansion |
| Elastic UI | eui.elastic.co/docs/components/containers/accordion/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/418ae1-accordion |
| Flowbite | flowbite.com/docs/components/accordion/ |
| Forma 36 | f36.contentful.com/components/accordion |
| Generic Components | genericcomponents.netlify.app/generic-accordion/demo/index.html |
| giffgaff | giffgaff.design/components/for-web/accordion/ |
| Gold (AU Gov) | gold.designsystemau.org/components/accordion/ |
| Grommet | v2.grommet.io/accordion |
| Helsinki | hds.hel.fi/components/accordion |
| Inclusive Components | inclusive-components.design/collapsible-sections/ |
| Instructure | instructure.design/#ToggleDetails |
| Jokul | jokul.fremtind.no/komponenter/accordion |
| Mozilla Protocol | protocol.mozilla.org/components/detail/details.html |
| Newskit | newskit.co.uk/components/accordion/ |
| NHS | service-manual.nhs.uk/design-system/components/expander |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/54d9a8-expandable |
| British Gas | britishgas.design/docs/components/ns-accordion |
| ONS | ons-design-system.netlify.app/components/accordion/ |
| Ontario | designsystem.ontario.ca/components/detail/accordions.html |
| Orbit (Kiwi) | orbit.kiwi/components/accordion/ |
| GitLab Pajamas | design.gitlab.com/components/accordion |
| Paste (Twilio) | paste.twilio.design/components/disclosure |
| Porsche | designsystem.porsche.com/v3/components/accordion/examples |
| Primer | primer.style/design/components/details |
| Quasar | quasar.dev/vue-components/expansion-item |
| Reach UI | reach.tech/accordion |
| Red Hat | ux.redhat.com/elements/accordion/ |
| Ruter | components.ruter.as/#/Components/Interactive/Accordion |
| Sainsbury's | design-systems.sainsburys.co.uk/components/accordion/ |
| SEB | designlibrary.sebgroup.com/components/accordion/ |
| Seek | seek-oss.github.io/seek-style-guide/accordion |
| Shoelace | shoelace.style/components/details |
| Guardian | theguardian.design/2a1e5182b/p/38c5aa-accordion |
| Stack Overflow | stackoverflow.design/product/components/expandable |
| Sprout Social | sproutsocial.com/seeds/components/collapsible |
| Skyscanner | skyscanner.design/latest/components/accordion/web-sEshz9Z5 |
| Subzero (Axis) | subzero.axis.bank.in/components/accordion |
| USWDS | designsystem.digital.gov/components/accordion/ |
| Visa | design.visa.com/components/accordion/ |
| W3C | design-system.w3.org/components/collapsible-containers.html |
| Wonderflow | design.wonderflow.ai/get-started/components/actions/accordion |
| Web Awesome | webawesome.com/docs/components/details/ |
| TFWM | designsystem.tfwm.org.uk/components/accordion/ |
| Workday Canvas | canvas.workday.com/components/containers/expandable-container |
| Auro (Alaska) | auro.alaskaair.com/components/auro/accordion |
| A11y Style Guide | a11y-style-guide.com/style-guide/section-navigation.html#kssref-navigation-accordion |
| BBC GEL | bbc.co.uk/gel/guidelines/accordion |
| Brighton & Hove | design.brighton-hove.gov.uk/website-pattern-library.php?p=expandable-helper |
| Talend | design.talend.com/?path=/docs/navigation-accordion--docs |
| Freshworks | crayons.freshworks.com/components/core/accordion/ |

---

### Alert
Notifications, banners, callouts, and inline messages. Also known as: Banner, Callout, Notice, Notification, Message, Flag.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/alert |
| Ant Design | ant.design/components/alert |
| Ant Design (Message) | ant.design/components/message |
| Ant Design (Notification) | ant.design/components/notification |
| Atlassian (Banner) | atlassian.design/components/banner/examples |
| Atlassian (Section Message) | atlassian.design/components/section-message/examples |
| Atlassian (Flag) | atlassian.design/components/flag/examples |
| Atlassian (Inline) | atlassian.design/components/inline-message/examples |
| Carbon | carbondesignsystem.com/components/notification/usage/ |
| Chakra UI | chakra-ui.com/docs/components/alert |
| Spectrum (Banner) | spectrum.adobe.com/page/alert-banner/ |
| Spectrum (Inline) | spectrum.adobe.com/page/in-line-alert/ |
| Polaris | polaris.shopify.com/components/feedback-indicators/banner |
| Lightning | lightningdesignsystem.com/components/notifications/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/messagebar |
| PatternFly (Alert) | patternfly.org/components/alert |
| PatternFly (Banner) | patternfly.org/components/banner |
| PatternFly (Hint) | patternfly.org/components/hint |
| GOV.UK | design-system.service.gov.uk/components/warning-text/ |
| Geist | vercel.com/geist/note |
| Hero UI | heroui.com/docs/components/alert |
| Gestalt | — |
| Reach UI | reach.tech/alert |
| Base Web | baseweb.design/components/notification/ |
| Base Web (Banner) | baseweb.design/components/banner/ |
| Blueprint | blueprintjs.com/docs/#core/components/callout |
| Bootstrap | getbootstrap.com/docs/4.3/components/alerts/ |
| Bolt | boltdesignsystem.com/pattern-lab/?p=viewall-components-banner |
| Bulma | bulma.io/documentation/elements/notification/ |
| Cauldron | cauldron.dequelabs.com/components/Alert |
| Cedar | cedar.rei.com/components/banner |
| Clarity | clarity.design/documentation/alert |
| Decathlon | decathlon.design/726f8c765/p/64b4b5-alert/b/129609 |
| Dell | delldesignsystem.com/components/message-bar/ |
| Duet | duetds.com/components/alert/ |
| eBay (MindPatterns) | ebay.gitbook.io/mindpatterns/messaging/inline-notice |
| eBay (Playbook) | playbook.ebay.com/design-system/components/alert-notice |
| Elastic UI | eui.elastic.co/docs/components/display/callout/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/559859-notification |
| Evergreen | evergreen.segment.com/components/alert |
| Flowbite | flowbite.com/docs/components/alerts/ |
| Forma 36 | f36.contentful.com/components/note |
| Generic Components | genericcomponents.netlify.app/generic-alert/demo/ |
| giffgaff | giffgaff.design/components/for-web/alerts/alert/ |
| Gold (AU Gov) | gold.designsystemau.org/components/page-alerts/ |
| HashiCorp Helios | helios.hashicorp.design/components/alert |
| Helsinki | hds.hel.fi/components/notification |
| Inclusive Components | inclusive-components.design/notifications/ |
| Instructure | instructure.design/#Alert |
| Morningstar | design.morningstar.com/systems/product/components/banner |
| Mozilla Protocol | protocol.mozilla.org/components/detail/notification-bar--default.html |
| Newskit (Banner) | newskit.co.uk/components/banner/ |
| Newskit (Inline) | newskit.co.uk/components/inline-message/ |
| NHS | service-manual.nhs.uk/design-system/components/warning-callout |
| Nord | nordhealth.design/components/banner/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/58a31a-message-bar |
| British Gas | britishgas.design/docs/components/ns-highlighter |
| ONS | ons-design-system.netlify.app/components/panel/ |
| Ontario | designsystem.ontario.ca/components/detail/page-alerts.html |
| GitLab Pajamas (Alert) | design.gitlab.com/components/alert |
| GitLab Pajamas (Banner) | design.gitlab.com/components/banner |
| Paste (Twilio) | paste.twilio.design/components/alert |
| Pharos | pharos.jstor.org/components/alert |
| Heroku Purple | design.herokai.com/purple3/docs/#banners |
| Quasar | quasar.dev/vue-components/banner |
| Red Hat (Alert) | ux.redhat.com/elements/alert/ |
| Red Hat (Announcement) | ux.redhat.com/elements/announcement/ |
| Ruter | components.ruter.as/#/Components/Notifications/Message |
| Sainsbury's | design-systems.sainsburys.co.uk/components/alerts/ |
| SEB | designlibrary.sebgroup.com/components/alerts/alert-ribbons/ |
| Seek | seek-oss.github.io/seek-style-guide/alert |
| Shoelace | shoelace.style/components/alert |
| Sprout Social | sproutsocial.com/seeds/components/alert |
| Guardian | theguardian.design/2a1e5182b/p/108ed3-user-feedback |
| Stack Overflow (Banners) | stackoverflow.design/product/components/banners |
| Stack Overflow (Notices) | stackoverflow.design/product/components/notices |
| Thumbprint | thumbprint.design/components/alert/react/ |
| Auro (Alaska) | auro.alaskaair.com/components/auro/alert |
| Skyscanner | skyscanner.design/latest/components/banner-alert/web-TyY0O2cu |
| Subzero (Axis) | — |
| USWDS | designsystem.digital.gov/components/alert/ |
| Visa (Banner) | design.visa.com/components/banner/ |
| Visa (Section) | design.visa.com/components/section-message/ |
| W3C | design-system.w3.org/components/notes.html |
| Wonderflow | design.wonderflow.ai/get-started/components/dialogs/snackbar |
| Web Awesome | webawesome.com/docs/components/callout/ |
| TFWM | designsystem.tfwm.org.uk/components/message/ |
| Wise | wise.design/components/alert |
| Workday Canvas | canvas.workday.com/components/indicators/banner/ |
| Brighton & Hove | design.brighton-hove.gov.uk/website-pattern-library.php?p=in-page-alerts |
| Talend | design.talend.com/?path=/docs/messaging-message--docs |
| Freshworks | crayons.freshworks.com/components/core/inline-message/ |
| GC Collab (Canada) | design.gccollab.ca/component/system-messaging |

---

### Avatar
User identity representations. Also known as: Profile Image, User Icon.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/avatar |
| Radix | radix-ui.com/primitives/docs/components/avatar |
| Ant Design | ant.design/components/avatar |
| Atlassian | atlassian.design/components/avatar/examples |
| Chakra UI | chakra-ui.com/docs/components/avatar |
| Spectrum | spectrum.adobe.com/page/avatar/ |
| Polaris | — |
| Lightning | lightningdesignsystem.com/components/avatar/ |
| PatternFly | patternfly.org/components/avatar |
| Geist | vercel.com/geist/avatar |
| Hero UI | heroui.com/docs/components/avatar |
| Gestalt | gestalt.pinterest.systems/web/avatar |
| Primer | primer.style/design/components/avatar |
| Primer (Pair) | primer.style/design/components/avatar-pair |
| Primer (Stack) | primer.style/design/components/avatar-stack |
| Base Web | baseweb.design/components/avatar/ |
| Elastic UI | eui.elastic.co/docs/components/display/avatar/ |
| Evergreen | evergreen.segment.com/components/avatar |
| Flowbite | flowbite.com/docs/components/avatar/ |
| GitLab Pajamas | design.gitlab.com/components/avatar |
| Instructure | instructure.design/#Avatar |
| Momentum | momentum.design/components/avatar |
| Morningstar | design.morningstar.com/systems/product/components/avatar |
| Nord | nordhealth.design/components/avatar/ |
| Quasar | quasar.dev/vue-components/avatar |
| Red Hat | ux.redhat.com/elements/avatar/ |
| Shoelace | shoelace.style/components/avatar |
| Stack Overflow | stackoverflow.design/product/components/avatars |
| Thumbprint | thumbprint.design/components/avatar/react/ |
| Auro (Alaska) | auro.alaskaair.com/components/auro/avatar |
| eBay (Playbook) | playbook.ebay.com/design-system/components/avatar |
| Freshworks | crayons.freshworks.com/components/core/avatar/ |
| Decathlon | — |
| Subzero (Axis) | subzero.axis.bank.in/components/avatar |
| Visa | design.visa.com/components/avatar/ |
| Wonderflow | design.wonderflow.ai/get-started/components/widgets/avatar |
| Web Awesome | webawesome.com/docs/components/avatar/ |
| Wise | wise.design/components/avatar |

---

### Badge
Status indicators and labels. Also known as: Tag, Chip, Pill, Lozenge, Label, Token, Status, Signal.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/badge |
| Ant Design (Badge) | ant.design/components/badge |
| Ant Design (Tag) | ant.design/components/tag |
| Atlassian (Badge) | atlassian.design/components/badge/examples |
| Atlassian (Lozenge) | atlassian.design/components/lozenge/examples |
| Atlassian (Tag) | atlassian.design/components/tag/examples |
| Carbon | carbondesignsystem.com/components/tag/usage/ |
| Chakra UI (Badge) | chakra-ui.com/docs/components/badge |
| Chakra UI (Tag) | chakra-ui.com/docs/components/tag |
| Chakra UI (Status) | chakra-ui.com/docs/components/status |
| Spectrum (Tag) | spectrum.adobe.com/page/tag/ |
| Spectrum (Badge) | spectrum.adobe.com/page/badge/ |
| Polaris (Tag) | polaris.shopify.com/components/selection-and-input/tag |
| Polaris (Badge) | polaris.shopify.com/components/feedback-indicators/badge |
| Lightning (Badge) | lightningdesignsystem.com/components/badges/ |
| Lightning (Pills) | lightningdesignsystem.com/components/pills/ |
| PatternFly (Badge) | patternfly.org/components/badge |
| PatternFly (Label) | patternfly.org/components/label |
| GOV.UK | design-system.service.gov.uk/components/tag/ |
| Geist | vercel.com/geist/badge |
| Hero UI (Badge) | heroui.com/docs/components/badge |
| Hero UI (Chip) | heroui.com/docs/components/chip |
| Gestalt (Badge) | gestalt.pinterest.systems/web/badge |
| Gestalt (Tag) | gestalt.pinterest.systems/web/tag |
| Primer (Counter) | primer.style/design/components/counter-label |
| Primer (Label) | primer.style/design/components/label |
| Primer (State) | primer.style/design/components/state-label |
| Primer (Token) | primer.style/design/components/token |
| Material 3 | m3.material.io/components/badges/overview |
| Base Web (Tag) | baseweb.design/components/tag/ |
| Base Web (Badge) | baseweb.design/components/badge/ |
| Blueprint (Tag) | blueprintjs.com/docs/#core/components/tag |
| Bootstrap | getbootstrap.com/docs/4.3/components/badge/ |
| Bulma | bulma.io/documentation/elements/tag/ |
| Cauldron (Badge) | cauldron.dequelabs.com/components/Badge |
| Cauldron (Tag) | cauldron.dequelabs.com/components/Tag |
| Clarity (Badge) | clarity.design/documentation/badge |
| Clarity (Label) | clarity.design/documentation/label |
| Decathlon (Badge) | decathlon.design/726f8c765/p/465f7c-badge/b/5496b9 |
| Decathlon (Tag) | decathlon.design/726f8c765/p/129f57-tag/b/065880 |
| Dell (Badge) | delldesignsystem.com/components/badge/ |
| Dell (Tag) | delldesignsystem.com/components/tag/ |
| eBay (Badge) | playbook.ebay.com/design-system/components/badge |
| eBay (Signal) | playbook.ebay.com/design-system/components/signal |
| Elastic UI | eui.elastic.co/docs/components/display/badge/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/9356c3-badge |
| Evergreen | evergreen.segment.com/components/badges |
| Flowbite | flowbite.com/docs/components/badge/ |
| Forma 36 | f36.contentful.com/components/badge |
| Gold (AU Gov) | gold.designsystemau.org/components/tags/ |
| HashiCorp Helios (Badge) | helios.hashicorp.design/components/badge |
| HashiCorp Helios (Tag) | helios.hashicorp.design/components/tag |
| Helsinki (Status) | hds.hel.fi/components/status-label |
| Helsinki (Tag) | hds.hel.fi/components/tag |
| Instructure (Badge) | instructure.design/#Badge |
| Instructure (Pill) | instructure.design/#Pill |
| Instructure (Tag) | instructure.design/#Tag |
| Jokul | jokul.fremtind.no/komponenter/tag |
| Momentum (Badge) | momentum.design/components/badge |
| Momentum (Chip) | momentum.design/components/chip |
| Morningstar | design.morningstar.com/systems/product/components/tag |
| NHS | service-manual.nhs.uk/design-system/components/tag |
| Nord | nordhealth.design/components/badge/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/97c5c0-badge |
| Newskit (Tag) | newskit.co.uk/components/tag/ |
| Newskit (Flag) | newskit.co.uk/components/flag/ |
| Orbit (Badge) | orbit.kiwi/components/badge/ |
| Orbit (Tag) | orbit.kiwi/components/tag/ |
| GitLab Pajamas (Badge) | design.gitlab.com/components/badge |
| GitLab Pajamas (Label) | design.gitlab.com/components/label |
| Porsche (Tag) | designsystem.porsche.com/v3/components/tag/examples |
| Heroku Purple | design.herokai.com/purple3/docs/#badges |
| Quasar (Badge) | quasar.dev/vue-components/badge |
| Quasar (Chip) | quasar.dev/vue-components/chip |
| Red Hat (Badge) | ux.redhat.com/elements/badge/ |
| Red Hat (Tag) | ux.redhat.com/elements/tag/ |
| Ruter | components.ruter.as/#/Components/Badges/StatusBadge |
| Sainsbury's | design-systems.sainsburys.co.uk/components/tag/ |
| Seek (Pill) | seek-oss.github.io/seek-style-guide/pill |
| Seek (Badge) | seek-oss.github.io/seek-style-guide/badge |
| Shoelace (Badge) | shoelace.style/components/badge |
| Shoelace (Tag) | shoelace.style/components/tag |
| Sprout Social | sproutsocial.com/seeds/components/badge |
| Skyscanner | skyscanner.design/latest/components/badge/overview-SAeHUC0G |
| Stack Overflow (Badges) | stackoverflow.design/product/components/badges |
| Stack Overflow (Tags) | stackoverflow.design/product/components/tags |
| Subzero (Badge) | subzero.axis.bank.in/components/badge |
| Subzero (Chip) | subzero.axis.bank.in/components/chip |
| Subzero (Tag) | subzero.axis.bank.in/components/tag |
| Thumbprint | thumbprint.design/components/pill/react/ |
| USWDS | designsystem.digital.gov/components/tag/ |
| Visa (Badge) | design.visa.com/components/badge/ |
| Visa (Chips) | design.visa.com/components/chips/ |
| Wonderflow | design.wonderflow.ai/get-started/components/widgets/chip |
| Web Awesome (Badge) | webawesome.com/docs/components/badge/ |
| Web Awesome (Tag) | webawesome.com/docs/components/tag/ |
| Workday Canvas (Status) | canvas.workday.com/components/indicators/status-indicator/ |
| Workday Canvas (Pill) | canvas.workday.com/components/indicators/pill |
| Auro (Alaska) | auro.alaskaair.com/components/auro/badge |
| Bolt | boltdesignsystem.com/pattern-lab/?p=viewall-components-chip |
| Talend (Tag) | design.talend.com/?path=/docs/messaging-tag--docs |
| Talend (Badge) | design.talend.com/?path=/docs/messaging-badge--docs |
| Talend (Status) | design.talend.com/?path=/docs/feedback-status--docs |
| Freshworks (Label) | crayons.freshworks.com/components/core/label/ |
| Freshworks (Tag) | crayons.freshworks.com/components/core/tag/ |
| Freshworks (Pill) | crayons.freshworks.com/components/core/pill/ |
| GC Collab (Canada) | design.gccollab.ca/component/badges |

---

### Breadcrumbs
Hierarchical navigation trail. Also known as: Breadcrumb.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/breadcrumb |
| Ant Design | ant.design/components/breadcrumb |
| Atlassian | atlassian.design/components/breadcrumbs/examples |
| Carbon | carbondesignsystem.com/components/breadcrumb/usage/ |
| Chakra UI | chakra-ui.com/docs/components/breadcrumb |
| Spectrum | spectrum.adobe.com/page/breadcrumbs/ |
| Polaris | — |
| Lightning | lightningdesignsystem.com/components/breadcrumbs/ |
| PatternFly | patternfly.org/components/breadcrumb |
| GOV.UK | design-system.service.gov.uk/components/breadcrumbs/ |
| Hero UI | heroui.com/docs/components/breadcrumbs |
| Gestalt | — |
| Primer | — |
| Base Web | baseweb.design/components/breadcrumbs/ |
| Blueprint | blueprintjs.com/docs/#core/components/breadcrumbs |
| Bootstrap | getbootstrap.com/docs/4.3/components/breadcrumb/ |
| Bulma | bulma.io/documentation/components/breadcrumb/ |
| Bolt | boltdesignsystem.com/pattern-lab/?p=viewall-components-breadcrumb |
| Cauldron | cauldron.dequelabs.com/components/Breadcrumb |
| Cedar | cedar.rei.com/components/breadcrumb |
| Clarity | — |
| Decathlon | decathlon.design/726f8c765/p/95fc13-breadcrumb/b/0027e1 |
| Dell | delldesignsystem.com/components/breadcrumb/ |
| eBay (MindPatterns) | ebay.gitbook.io/mindpatterns/navigation/breadcrumbs |
| eBay (Playbook) | playbook.ebay.com/design-system/components/breadcrumb |
| Elastic UI | eui.elastic.co/docs/components/navigation/breadcrumbs/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/717203-breadcrumbs-you-are-here |
| Flowbite | flowbite.com/docs/components/breadcrumb/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/breadcrumb |
| giffgaff | giffgaff.design/components/for-web/breadcrumbs/ |
| Gold (AU Gov) | gold.designsystemau.org/components/breadcrumbs/ |
| HashiCorp Helios | helios.hashicorp.design/components/breadcrumb |
| Helsinki | — |
| Instructure | instructure.design/#Breadcrumb |
| Jokul | jokul.fremtind.no/komponenter/breadcrumb |
| Mozilla Protocol | protocol.mozilla.org/components/detail/breadcrumb.html |
| Newskit | newskit.co.uk/components/breadcrumbs/ |
| NHS | service-manual.nhs.uk/design-system/components/breadcrumbs |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/3007f8-breadcrumbs |
| ONS | ons-design-system.netlify.app/components/breadcrumbs/ |
| Orbit (Kiwi) | orbit.kiwi/components/breadcrumbs |
| GitLab Pajamas | design.gitlab.com/components/breadcrumb |
| Pharos | pharos.jstor.org/components/breadcrumb |
| Quasar | quasar.dev/vue-components/breadcrumbs |
| Red Hat | ux.redhat.com/elements/breadcrumb/ |
| Ruter | components.ruter.as/#/Components/Navigation/Breadcrumbs |
| Sainsbury's | design-systems.sainsburys.co.uk/components/breadcrumb/ |
| SEB | designlibrary.sebgroup.com/components/breadcrumbs/ |
| Shoelace | — |
| Skyscanner | skyscanner.design/latest/components/breadcrumb/web-rxEpDVCn |
| Stack Overflow | stackoverflow.design/product/components/breadcrumbs |
| Subzero (Axis) | subzero.axis.bank.in/components/breadcrumb |
| USWDS | — |
| Visa | design.visa.com/components/breadcrumbs/ |
| W3C | design-system.w3.org/components/breadcrumbs.html |
| Web Awesome | webawesome.com/docs/components/breadcrumb/ |
| TFWM | designsystem.tfwm.org.uk/components/breadcrumb/ |
| Workday Canvas | canvas.workday.com/components/navigation/breadcrumbs |
| GC Collab (Canada) | design.gccollab.ca/component/breadcrumbs |
| Talend | design.talend.com/?path=/docs/navigation-breadcrumbs--docs |

---

### Button
Primary action triggers. Also known as: CTA, Action Button, Icon Button, FAB.

| System | URL |
|--------|-----|
| shadcn/ui (Button) | ui.shadcn.com/docs/components/button |
| shadcn/ui (Toggle) | ui.shadcn.com/docs/components/toggle |
| Headless UI | headlessui.com/react/button |
| Ariakit | ariakit.org/components/button |
| Ant Design | ant.design/components/button |
| Ant Design (Float) | ant.design/components/float-button |
| Atlassian | atlassian.design/components/button/examples |
| Carbon | carbondesignsystem.com/components/button/usage/ |
| Chakra UI | chakra-ui.com/docs/components/button |
| Chakra UI (Icon) | chakra-ui.com/docs/components/icon-button |
| Spectrum (Action) | spectrum.adobe.com/page/action-button/ |
| Spectrum (Button) | spectrum.adobe.com/page/button/ |
| Polaris | polaris.shopify.com/components/actions/button |
| Lightning | lightningdesignsystem.com/components/buttons/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/button |
| Material 3 | m3.material.io/components/all-buttons |
| PatternFly | patternfly.org/components/button |
| GOV.UK | design-system.service.gov.uk/components/button/ |
| Geist | vercel.com/geist/button |
| Hero UI | heroui.com/docs/components/button |
| Gestalt | gestalt.pinterest.systems/web/button |
| Gestalt (Icon) | gestalt.pinterest.systems/web/iconbutton |
| Primer | primer.style/design/components/button |
| Primer (Icon) | primer.style/design/components/icon-button |
| Base Web | baseweb.design/components/button/ |
| Blueprint | blueprintjs.com/docs/#core/components/buttons |
| Bootstrap | getbootstrap.com/docs/4.3/components/buttons/ |
| Bulma | bulma.io/documentation/elements/button/ |
| Cauldron | cauldron.dequelabs.com/components/Button |
| Cedar | cedar.rei.com/components/button |
| Clarity | clarity.design/documentation/button |
| Decathlon | decathlon.design/726f8c765/p/8008f8-button/b/50afe1 |
| Dell | delldesignsystem.com/components/button/ |
| Duet | duetds.com/components/button/ |
| eBay | playbook.ebay.com/design-system/components/button |
| Elastic UI | eui.elastic.co/docs/components/navigation/buttons/button/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/37fb17-button |
| Evergreen | — |
| Flowbite | flowbite.com/docs/components/buttons/ |
| Forma 36 | f36.contentful.com/components/button |
| giffgaff | giffgaff.design/components/for-web/buttons/ |
| Gold (AU Gov) | gold.designsystemau.org/components/buttons/ |
| Grommet | v2.grommet.io/button |
| HashiCorp Helios | helios.hashicorp.design/components/button |
| Helsinki | hds.hel.fi/components/button |
| Inclusive Components | — |
| Instructure | instructure.design/#Button |
| Jokul | jokul.fremtind.no/komponenter/buttons |
| Morningstar | design.morningstar.com/systems/product/components/button |
| Mozilla Protocol | protocol.mozilla.org/components/detail/button--primary.html |
| Newskit | newskit.co.uk/components/button/ |
| NHS | service-manual.nhs.uk/design-system/components/buttons |
| Nord | nordhealth.design/components/button/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/886087-button |
| ONS | ons-design-system.netlify.app/components/button/ |
| Ontario | designsystem.ontario.ca/components/detail/buttons.html |
| Orbit (Kiwi) | orbit.kiwi/components/button/ |
| GitLab Pajamas | design.gitlab.com/components/button |
| Paste (Twilio) | paste.twilio.design/components/button |
| Pharos | pharos.jstor.org/components/button |
| Porsche | designsystem.porsche.com/v3/components/button/examples |
| Heroku Purple | design.herokai.com/purple3/docs/#buttons |
| Quasar | quasar.dev/vue-components/button |
| Red Hat | ux.redhat.com/elements/button/ |
| Ruter | components.ruter.as/#/Components/Buttons/Button |
| Sainsbury's | design-systems.sainsburys.co.uk/components/button/ |
| SEB | designlibrary.sebgroup.com/components/forms/button/ |
| Seek | seek-oss.github.io/seek-style-guide/button |
| Shoelace | shoelace.style/components/button |
| Sprout Social | sproutsocial.com/seeds/components/button |
| Guardian | theguardian.design/2a1e5182b/p/435225-button |
| Stack Overflow | stackoverflow.design/product/components/buttons |
| Thumbprint | thumbprint.design/components/button/usage/ |
| Skyscanner | skyscanner.design/latest/components/button/overview-sxyKum4C |
| Subzero (Axis) | subzero.axis.bank.in/components/button |
| USWDS | designsystem.digital.gov/components/button/ |
| Visa | design.visa.com/components/button/ |
| W3C | design-system.w3.org/styles/buttons.html |
| Wonderflow | design.wonderflow.ai/get-started/components/actions/button |
| Web Awesome | webawesome.com/docs/components/button/ |
| TFWM | designsystem.tfwm.org.uk/components/buttons/ |
| Wise | wise.design/components/button |
| Workday Canvas | canvas.workday.com/components/buttons/button |
| Auro (Alaska) | auro.alaskaair.com/components/auro/button |
| 98.css | jdan.github.io/98.css/#button |
| A11y Style Guide | a11y-style-guide.com/style-guide/section-general.html#kssref-general-buttons |
| Brighton & Hove | design.brighton-hove.gov.uk/website-pattern-library.php?p=in-page-buttons |
| Talend | design.talend.com/?path=/docs/clickable-button--docs |
| Freshworks | crayons.freshworks.com/components/core/button/ |
| GC Collab (Canada) | design.gccollab.ca/component/buttons |
| Nostyle | nostyle.onrender.com/components/button |

---

### Button Group
Grouped action buttons. Also known as: Button Set, Action Bar, Button Dock, Command Bar.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/toggle-group |
| Spectrum (Action Group) | spectrum.adobe.com/page/action-group/ |
| Spectrum (Button Group) | spectrum.adobe.com/page/button-group/ |
| Polaris | polaris.shopify.com/components/actions/button-group |
| Polaris (Page Actions) | polaris.shopify.com/components/actions/page-actions |
| Primer (Action Bar) | primer.style/design/components/action-bar |
| Primer (Button Group) | primer.style/design/components/button-group |
| Base Web | baseweb.design/components/button-group/ |
| Blueprint | blueprintjs.com/docs/#core/components/button-group |
| Bootstrap | getbootstrap.com/docs/4.3/components/button-group/ |
| Clarity | clarity.design/documentation/button-group |
| Elastic UI | eui.elastic.co/docs/components/navigation/buttons/group/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/923d96-buttongroup |
| Flowbite | flowbite.com/docs/components/button-group/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/commandbar |
| Forma 36 | f36.contentful.com/components/button-group |
| Gestalt | gestalt.pinterest.systems/web/buttongroup |
| HashiCorp Helios | helios.hashicorp.design/components/button-set |
| Lightning | lightningdesignsystem.com/components/button-groups/ |
| Mozilla Protocol | protocol.mozilla.org/components/detail/button-container--default.html |
| Nord | nordhealth.design/components/button-group/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/61b5f9-button-group |
| Orbit (Kiwi) | orbit.kiwi/components/buttongroup/ |
| PatternFly | patternfly.org/components/action-list |
| Porsche | designsystem.porsche.com/v3/components/button-group/examples |
| Quasar | quasar.dev/vue-components/button-group |
| Ruter | components.ruter.as/#/Components/Buttons/ButtonGroup |
| Seek | seek-oss.github.io/seek-style-guide/button-group |
| Shoelace | shoelace.style/components/button-group |
| Stack Overflow | stackoverflow.design/product/components/button-groups |
| Thumbprint | thumbprint.design/components/button-row/react/ |
| Web Awesome | webawesome.com/docs/components/button-group/ |
| Workday Canvas | canvas.workday.com/components/buttons/action-bar |
| Talend | design.talend.com/?path=/docs/form-buttons--docs |
| Freshworks | crayons.freshworks.com/components/core/button-group/ |

---

### Card
Content containers. Also known as: Tile, Panel, Document Card, Content Card, Product Card.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/card |
| Ant Design | ant.design/components/card |
| Carbon | — |
| Chakra UI | chakra-ui.com/docs/components/card |
| Spectrum | spectrum.adobe.com/page/cards/ |
| Polaris | polaris.shopify.com/components/layout-and-structure/card |
| Lightning | lightningdesignsystem.com/components/cards/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/documentcard |
| Material 3 | m3.material.io/components/cards/overview |
| PatternFly | patternfly.org/components/card |
| Geist | — |
| Hero UI | heroui.com/docs/components/card |
| Gestalt | gestalt.pinterest.systems/web/activationcard |
| Base Web | baseweb.design/components/card/ |
| Blueprint | blueprintjs.com/docs/#core/components/card |
| Bootstrap | getbootstrap.com/docs/4.3/components/card/ |
| Bolt | boltdesignsystem.com/pattern-lab/?p=viewall-components-card |
| Bulma | bulma.io/documentation/components/card/ |
| Cedar | cedar.rei.com/components/card |
| Clarity | clarity.design/documentation/card |
| Decathlon | decathlon.design/726f8c765/p/88fc2b-card/b/51e109 |
| Dell | delldesignsystem.com/components/card/ |
| Duet | duetds.com/components/card/ |
| eBay (Tile) | ebay.gitbook.io/mindpatterns/navigation/tile |
| eBay (Playbook) | playbook.ebay.com/design-system/components/item-tile |
| Elastic UI | eui.elastic.co/docs/components/containers/card/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/850b09-card |
| Evergreen | — |
| Flowbite | flowbite.com/docs/components/card/ |
| Forma 36 | f36.contentful.com/components/card |
| giffgaff | giffgaff.design/components/for-web/cards/ |
| Gold (AU Gov) | gold.designsystemau.org/components/card/ |
| HashiCorp Helios | helios.hashicorp.design/components/card |
| Helsinki | hds.hel.fi/components/card |
| Inclusive Components | inclusive-components.design/cards/ |
| Jokul | jokul.fremtind.no/komponenter/card |
| Morningstar | design.morningstar.com/systems/product/components/card |
| Mozilla Protocol | protocol.mozilla.org/components/detail/card--overview.html |
| Newskit | newskit.co.uk/components/card/ |
| NHS | service-manual.nhs.uk/design-system/components/card |
| Nord | nordhealth.design/components/card/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/26b3c4-tile |
| British Gas | britishgas.design/docs/components/ns-card |
| ONS | ons-design-system.netlify.app/components/card/ |
| Orbit (Kiwi) | orbit.kiwi/components/card/ |
| GitLab Pajamas | design.gitlab.com/components/card |
| Paste (Twilio) | paste.twilio.design/components/card |
| Pharos | pharos.jstor.org/components/image-card |
| Polaris (Callout) | polaris.shopify.com/components/layout-and-structure/callout-card |
| Quasar | quasar.dev/vue-components/card |
| Red Hat (Card) | ux.redhat.com/elements/card/ |
| Red Hat (Tile) | ux.redhat.com/elements/tile/ |
| Ruter | components.ruter.as/#/Components/Cards/Card |
| Sainsbury's (Content) | design-systems.sainsburys.co.uk/components/content-card/ |
| Sainsbury's (Product) | design-systems.sainsburys.co.uk/components/product-card/ |
| SEB | designlibrary.sebgroup.com/components/card/ |
| Seek | seek-oss.github.io/seek-style-guide/card |
| Shoelace | shoelace.style/components/card |
| Stack Overflow | stackoverflow.design/product/components/cards |
| Thumbprint | thumbprint.design/components/service-card/usage/ |
| Skyscanner | skyscanner.design/latest/components/content-cards/web-n7qSZpec |
| Visa | design.visa.com/components/content-card/ |
| W3C | design-system.w3.org/components/cards.html |
| Wonderflow | design.wonderflow.ai/get-started/components/layouts/card |
| Web Awesome | webawesome.com/docs/components/card/ |
| TFWM | designsystem.tfwm.org.uk/components/content-card/ |
| Workday Canvas | canvas.workday.com/components/containers/card |
| Auro (Alaska) | auro.alaskaair.com/components/auro/card |
| A11y Style Guide | a11y-style-guide.com/style-guide/section-cards.html |
| Talend | design.talend.com/?path=/docs/layout-card--docs |
| GC Collab (Canada) | design.gccollab.ca/component/cards |

---

### Carousel
Scrollable content rotators. Also known as: Slider, Filmstrip, Content Slider.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/carousel |
| Ant Design | ant.design/components/carousel |
| Material 3 | m3.material.io/components/carousel/overview |
| Porsche | designsystem.porsche.com/v3/components/carousel/examples |
| Auro (Alaska) | auro.alaskaair.com/components/auro/carousel |
| BBC GEL | bbc.co.uk/gel/guidelines/carousel |
| Bootstrap | getbootstrap.com/docs/4.3/components/carousel/ |
| Cedar | cedar.rei.com/components/filmstrip |
| eBay (MindPatterns) | ebay.gitbook.io/mindpatterns/disclosure/carousel |
| eBay (Playbook) | playbook.ebay.com/design-system/components/carousel |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/362948-carousel-wip |
| Flowbite | flowbite.com/docs/components/carousel/ |
| Grommet | v2.grommet.io/carousel |
| Inclusive Components | inclusive-components.design/a-content-slider/ |
| Lightning | lightningdesignsystem.com/components/carousel/ |
| Quasar | quasar.dev/vue-components/carousel |
| Sainsbury's | design-systems.sainsburys.co.uk/components/carousel/ |
| Skyscanner | skyscanner.design/latest/components/calendar/web-DDIY8XIe |
| Subzero (Axis) | subzero.axis.bank.in/components/carousel |
| Thumbprint | thumbprint.design/components/carousel/react/ |
| W3C | design-system.w3.org/components/slider.html |
| Web Awesome | webawesome.com/docs/components/carousel/ |

---

### Checkbox
Binary selection inputs. Also known as: Checkbox Card, Check.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/checkbox |
| Radix | radix-ui.com/primitives/docs/components/checkbox |
| Headless UI | headlessui.com/react/checkbox |
| Ariakit | ariakit.org/components/checkbox |
| Ant Design | ant.design/components/checkbox |
| Atlassian | atlassian.design/components/checkbox/examples |
| Carbon | carbondesignsystem.com/components/checkbox/usage/ |
| Chakra UI | chakra-ui.com/docs/components/checkbox |
| Chakra UI (Card) | chakra-ui.com/docs/components/checkbox-card |
| Spectrum | spectrum.adobe.com/page/checkbox/ |
| Polaris | polaris.shopify.com/components/selection-and-input/checkbox |
| Lightning | lightningdesignsystem.com/components/checkbox/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/checkbox |
| Material 3 | m3.material.io/components/checkbox/overview |
| PatternFly | patternfly.org/components/forms/checkbox |
| GOV.UK | design-system.service.gov.uk/components/checkboxes/ |
| Geist | vercel.com/geist/checkbox |
| Hero UI | heroui.com/docs/components/checkbox |
| Gestalt | gestalt.pinterest.systems/web/checkbox |
| Primer | primer.style/design/components/checkbox |
| Reach UI | reach.tech/checkbox |
| Base Web | baseweb.design/components/checkbox/ |
| Blueprint | blueprintjs.com/docs/#core/components/checkbox |
| Cauldron | cauldron.dequelabs.com/components/Checkbox |
| Cedar | cedar.rei.com/components/checkbox |
| Clarity | clarity.design/documentation/checkbox |
| Decathlon | decathlon.design/726f8c765/p/953c37-checkbox/b/5496b9 |
| Dell | delldesignsystem.com/components/checkbox/ |
| Duet | duetds.com/components/checkbox/ |
| eBay | playbook.ebay.com/design-system/components/checkbox |
| Elastic UI | eui.elastic.co/docs/components/forms/selection/checkbox-and-checkbox-group/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/904ea9-checkbox |
| Evergreen | evergreen.segment.com/components/checkbox |
| Flowbite | flowbite.com/docs/forms/checkbox/ |
| Forma 36 | f36.contentful.com/components/checkbox |
| giffgaff | giffgaff.design/components/for-web/form-inputs/checkbox/ |
| Gold (AU Gov) | gold.designsystemau.org/components/control-input/#checkbox |
| Grommet | v2.grommet.io/checkbox |
| HashiCorp Helios | helios.hashicorp.design/components/form/checkbox |
| Helsinki | hds.hel.fi/components/checkbox |
| Instructure | instructure.design/#Checkbox |
| Jokul | jokul.fremtind.no/komponenter/checkbox |
| Momentum | momentum.design/components/checkbox |
| Morningstar | design.morningstar.com/systems/product/components/checkbox |
| Mozilla Protocol | protocol.mozilla.org/components/detail/checkboxes.html |
| Newskit | newskit.co.uk/components/checkbox/ |
| NHS | service-manual.nhs.uk/design-system/components/checkboxes |
| Nord | nordhealth.design/components/checkbox/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/87cb23-checkbox |
| ONS | ons-design-system.netlify.app/components/checkboxes/ |
| Ontario | designsystem.ontario.ca/components/detail/checkboxes.html |
| Orbit (Kiwi) | orbit.kiwi/components/checkbox/ |
| GitLab Pajamas | design.gitlab.com/components/checkbox |
| Pharos | pharos.jstor.org/components/checkbox |
| Porsche | designsystem.porsche.com/v3/components/checkbox-wrapper/examples |
| Quasar | quasar.dev/vue-components/checkbox |
| Ruter | components.ruter.as/#/Components/Forms/Checkbox |
| Sainsbury's | design-systems.sainsburys.co.uk/components/checkbox/ |
| SEB | designlibrary.sebgroup.com/components/forms/checkbox/ |
| Seek | seek-oss.github.io/seek-style-guide/checkbox |
| Shoelace | shoelace.style/components/checkbox |
| Sprout Social | sproutsocial.com/seeds/components/checkbox |
| Guardian | theguardian.design/2a1e5182b/p/466fad-checkbox |
| Stack Overflow | stackoverflow.design/product/components/checkbox |
| Subzero (Axis) | subzero.axis.bank.in/components/checkbox |
| Thumbprint | thumbprint.design/components/checkbox/react/ |
| USWDS | — |
| Visa | design.visa.com/components/checkbox/ |
| W3C | design-system.w3.org/styles/forms.html#checkboxes |
| Web Awesome | webawesome.com/docs/components/checkbox/ |
| TFWM | designsystem.tfwm.org.uk/components/checkboxes/ |
| Wise | wise.design/components/checkbox |
| Workday Canvas | canvas.workday.com/components/inputs/checkbox |
| Auro (Alaska) | auro.alaskaair.com/components/auro/checkbox |
| Skyscanner | skyscanner.design/latest/components/checkbox/web-iTrW8zds |
| 98.css | jdan.github.io/98.css/#checkbox |
| Talend | design.talend.com/?path=/docs/form-fields-checkbox--docs |
| Freshworks | crayons.freshworks.com/components/core/checkbox/ |
| Nostyle | nostyle.onrender.com/components/checkboxes |

---

### Color Picker
Color selection interfaces. Also known as: Color Area, Color Slider, Swatch Picker, Palette Picker.

| System | URL |
|--------|-----|
| Chakra UI | chakra-ui.com/docs/components/color-picker |
| Spectrum (Area) | spectrum.adobe.com/page/color-area/ |
| Spectrum (Slider) | spectrum.adobe.com/page/color-slider/ |
| Spectrum (Wheel) | spectrum.adobe.com/page/color-wheel/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/colorpicker |
| Elastic UI | eui.elastic.co/docs/components/forms/other/color-picker/ |
| Lightning | lightningdesignsystem.com/components/color-picker/ |
| Quasar | quasar.dev/vue-components/color-picker |
| Sainsbury's | design-systems.sainsburys.co.uk/components/colour-swatch/ |
| Shoelace | shoelace.style/components/color-picker |
| Visa | design.visa.com/components/color-selector/ |
| Web Awesome | webawesome.com/docs/components/color-picker/ |
| Workday Canvas | canvas.workday.com/components/inputs/color-input |
| Talend | design.talend.com/?path=/docs/form-fields-color--docs |

---

### Combobox
Searchable selection inputs. Also known as: Autocomplete, Autosuggest, Typeahead, Lookup, Super Select.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/combobox |
| Headless UI | headlessui.com/react/combobox |
| Ariakit | ariakit.org/components/combobox |
| Ant Design | ant.design/components/auto-complete |
| Spectrum | spectrum.adobe.com/page/combo-box/ |
| Lightning | lightningdesignsystem.com/components/combobox/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/combobox |
| Geist | vercel.com/geist/combobox |
| Reach UI | reach.tech/combobox |
| Base Web | baseweb.design/components/combobox/ |
| Bolt | boltdesignsystem.com/pattern-lab/?p=viewall-components-typeahead |
| Cauldron | cauldron.dequelabs.com/components/Combobox |
| Clarity | clarity.design/documentation/combobox |
| Dell | delldesignsystem.com/components/dropdown/ |
| eBay | playbook.ebay.com/design-system/components/combobox |
| Elastic UI | eui.elastic.co/docs/components/forms/selection/super-select/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/082dd3-combobox |
| Evergreen | evergreen.segment.com/components/combobox |
| Forma 36 | f36.contentful.com/components/autocomplete |
| Generic Components | genericcomponents.netlify.app/generic-listbox/demo/index.html |
| Morningstar | design.morningstar.com/systems/product/components/combo-box |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/07c070-autosuggest |
| ONS | ons-design-system.netlify.app/components/autosuggest/ |
| Paste (Twilio) | paste.twilio.design/components/combobox |
| Pharos | pharos.jstor.org/components/combobox |
| Primer | primer.style/design/components/autocomplete |
| Sainsbury's | design-systems.sainsburys.co.uk/components/combobox/ |
| Seek | seek-oss.github.io/seek-style-guide/autosuggest |
| Visa | design.visa.com/components/combobox/ |
| W3C | design-system.w3.org/styles/forms.html#auto-complete |
| Wonderflow | design.wonderflow.ai/get-started/components/inputs/autocomplete |
| Skyscanner | skyscanner.design/latest/components/autosuggest/web-1dnVX8RX |
| Talend | design.talend.com/?path=/docs/form-fields-combobox--fieldcombobox |
| Nostyle | nostyle.onrender.com/components/autocomplete |

---

### Date Input
Text-based date entry fields. Also known as: Date Field, Memorable Date, Compact Date Input.

| System | URL |
|--------|-----|
| Hero UI | heroui.com/docs/components/date-input |
| Gestalt | gestalt.pinterest.systems/web/datefield |
| GOV.UK | design-system.service.gov.uk/components/date-input/ |
| Helsinki | hds.hel.fi/components/date-input |
| Instructure | instructure.design/#DateInput |
| Mozilla Protocol | protocol.mozilla.org/components/detail/input--date.html |
| NHS | service-manual.nhs.uk/design-system/components/date-input |
| Nord | nordhealth.design/components/date-picker/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/5190ba-date-input |
| TFWM | designsystem.tfwm.org.uk/components/date-input/ |
| Wise | wise.design/components/date-input |
| Wise (Compact) | wise.design/components/compact-date-input |
| Brighton & Hove | design.brighton-hove.gov.uk/website-pattern-library.php?p=date-input |
| giffgaff | giffgaff.design/components/for-web/form-inputs/date-input/ |
| Nostyle | nostyle.onrender.com/components/memorable-date |
| Talend | design.talend.com/?path=/docs/form-fields-date--docs |

---

### Datepicker
Calendar-based date selection. Also known as: Calendar, Date Picker, Date Range, Month Picker.

| System | URL |
|--------|-----|
| shadcn/ui | ui.shadcn.com/docs/components/calendar |
| Ant Design | ant.design/components/date-picker |
| Atlassian | atlassian.design/components/datetime-picker/examples |
| Carbon | carbondesignsystem.com/components/date-picker/usage/ |
| Material 3 | m3.material.io/components/date-pickers/overview |
| Lightning | lightningdesignsystem.com/components/datepickers/ |
| Fluent UI | developer.microsoft.com/en-us/fluentui#/controls/web/datepicker |
| PatternFly | patternfly.org/components/date-and-time/date-picker |
| Geist | vercel.com/geist/calendar |
| Hero UI (Calendar) | heroui.com/docs/components/calendar |
| Hero UI (Range) | heroui.com/docs/components/range-calendar |
| Gestalt | gestalt.pinterest.systems/web/datepicker |
| Gestalt (Range) | gestalt.pinterest.systems/web/daterange |
| Base Web | baseweb.design/components/datepicker/ |
| Blueprint | blueprintjs.com/docs/#datetime2/date-picker3 |
| Clarity | clarity.design/documentation/datepicker |
| Dell | delldesignsystem.com/components/date-picker/ |
| eBay | playbook.ebay.com/design-system/components/date-picker |
| Elastic UI | eui.elastic.co/docs/components/forms/date-and-time/date-picker/ |
| Elisa | designsystem.elisa.fi/9b207b2c3/p/185f64-datepicker |
| Flowbite | flowbite.com/docs/components/datepicker/ |
| Jokul | jokul.fremtind.no/komponenter/datepicker |
| Morningstar | design.morningstar.com/systems/product/components/date-picker |
| Nord | nordhealth.design/components/calendar/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/30e5a5-datepicker-input |
| British Gas | britishgas.design/docs/components/ns-datepicker |
| GitLab Pajamas | design.gitlab.com/components/date-picker |
| Quasar | quasar.dev/vue-components/date |
| Ruter | components.ruter.as/#/Components/Interactive/DatePicker |
| Sainsbury's | design-systems.sainsburys.co.uk/components/date-picker/ |
| SEB | designlibrary.sebgroup.com/components/date-picker/ |
| Seek | seek-oss.github.io/seek-style-guide/monthpicker |
| Subzero (Axis) | subzero.axis.bank.in/components/date-picker |
| Visa | design.visa.com/components/date-selector/ |
| Skyscanner | skyscanner.design/latest/components/datepicker/web-QqbdTkly |
| Freshworks | crayons.freshworks.com/components/core/datepicker/ |
| Nostyle | nostyle.onrender.com/components/date-picker |

---

### Drawer
Slide-in panels from screen edges. Also known as: Sheet, Side Panel, Bottom Sheet, Flyout, Tray.

| System | URL |
|--------|-----|
| shadcn/ui (Drawer) | ui.shadcn.com/docs/components/drawer |
| shadcn/ui (Sheet) | ui.shadcn.com/docs/components/sheet |
| Ant Design | ant.design/components/drawer |
| Atlassian | atlassian.design/components/drawer/examples |
| Chakra UI | chakra-ui.com/docs/components/drawer |
| Spectrum | spectrum.adobe.com/page/tray/ |
| PatternFly (Drawer) | patternfly.org/components/drawer |
| PatternFly (Notification) | patternfly.org/components/notification-drawer |
| Geist | vercel.com/geist/drawer |
| Hero UI | heroui.com/docs/components/drawer |
| Material 3 | m3.material.io/components/side-sheets/guidelines |
| Base Web | baseweb.design/components/drawer/ |
| Blueprint | blueprintjs.com/docs/#core/components/drawer |
| Cauldron (Bottom Sheet) | cauldron.dequelabs.com/components/BottomSheet |
| Cauldron (Drawer) | cauldron.dequelabs.com/components/Drawer |
| Dell | delldesignsystem.com/components/drawer/ |
| eBay (Bottom Sheet) | playbook.ebay.com/design-system/components/bottom-sheet |
| eBay (Panel) | playbook.ebay.com/design-system/components/panel |
| Flowbite | flowbite.com/docs/components/drawer/ |
| HashiCorp Helios | helios.hashicorp.design/components/flyout |
| Instructure | instructure.design/#DrawerLayout |
| Newskit | newskit.co.uk/components/drawer/ |
| Nord | nordhealth.design/components/drawer/ |
| NS (Dutch Rail) | design.ns.nl/4a05a30ad/p/17e19a-side-drawer |
| Orbit (Kiwi) | orbit.kiwi/components/drawer/ |
| GitLab Pajamas | design.gitlab.com/components/drawer |
| Porsche | designsystem.porsche.com/v3/components/flyout/examples |
| Sainsbury's | design-systems.sainsburys.co.uk/components/drawer/ |
| Shoelace | shoelace.style/components/drawer |
| Sprout Social | sproutsocial.com/seeds/components/drawer |
| Subzero (Axis) | subzero.axis.bank.in/components/bottom-sheet |
| Visa (Nav Drawer) | design.visa.com/components/navigation-drawer/ |
| Visa (Panel) | design.visa.com/components/panel/ |
| Wonderflow | design.wonderflow.ai/get-started/components/dialogs/drawer |
| Web Awesome | webawesome.com/docs/components/drawer/ |
| Workday Canvas | canvas.workday.com/components/containers/side-panel |
| Skyscanner | skyscanner.design/latest/components/drawer/web-QAxL5e0N |
| Talend | design.talend.com/?path=/docs/navigation-floatingdrawer--docs |

---

### Dropdown Menu
Context menus and action menus. Also known as: Menu, Context Menu, Action Menu, Options Menu, Listbox.

| System | URL |
|--------|-----|
| Ariakit (Menu) | ariakit.org/components/menu |
| Ariakit (Menubar) | ariakit.org/components/menubar |
| Ant Design | ant.design/components/dropdown |
| Atlassian | atlassian.design/components/dropdown-menu/examples |
| Carbon | carbondesignsystem.com/components/overflow-menu/usage/ |
| Headless UI | headlessui.com/react/menu |
| Spectrum | — |
| Lightning | — |
| Fluent UI (Dropdown) | developer.microsoft.com/en-us/fluentui#/controls/web/dropdown |
| Fluent UI (Context) | developer.microsoft.com/en-us/fluentui#/controls/web/contextualmenu |
| Geist | vercel.com/geist/menu |
| Gestalt | gestalt.pinterest.systems/web/dropdown |
| Blueprint | blueprintjs.com/docs/#core/components/menu |
| Bootstrap | getbootstrap.com/docs/4.3/components/dropdowns/ |
| Bulma | bulma.io/documentation/components/dropdown/ |
| Cauldron | cauldron.dequelabs.com/components/OptionsMenu |
| Clarity | clarity.design/documentation/dropdown |
| Dell | delldesignsystem.com/components/action-menu/ |
| eBay (Listbox) | ebay.gitbook.io/mindpatterns/input/listbox-button |
| Elastic UI | eui.elastic.co/docs/components/navigation/context-menu/ |
| Evergreen | evergreen.segment.com/components/select-menu |
| Flowbite | flowbite.com/docs/components/dropdowns/ |
| Forma 36 | f36.contentful.com/components/menu |
| Grommet | v2.grommet.io/menu |
| Decathlon | decathlon.design/726f8c765/p/42d824-dropdown/b/6647a9 |
| Freshworks | crayons.freshworks.com/components/core/menu/ |
| Talend | design.talend.com/?path=/docs/clickable-dropdown--docs |

---

## Coverage Statistics

| Category | Components Listed | Avg Systems per Component |
|----------|-------------------|--------------------------|
| Layout | Accordion, Carousel | ~40 |
| Navigation | Breadcrumbs | ~45 |
| Actions | Button, Button Group | ~70, ~35 |
| Data Display | Avatar, Badge, Card | ~35, ~65, ~55 |
| Feedback | Alert | ~60 |
| Inputs | Checkbox, Color Picker, Combobox, Date Input, Datepicker | ~60, ~14, ~30, ~16, ~30 |
| Overlays | Drawer, Dropdown Menu | ~35, ~25 |

**Total unique design systems indexed: 110+**
**Total component-to-system mappings: 900+**

---

## Agent Quick-Reference

When scaffolding a new component:
1. Find the component category above
2. Check shadcn/ui first (our primary mapping target)
3. Cross-reference Radix/Headless UI for headless primitives
4. Sample 3 additional systems for prop consensus
5. Note naming variants (the "Also known as" line) for search

When auditing completeness:
1. Walk each category header
2. Check if the project has an equivalent
3. Flag missing components by priority (Buttons/Inputs are critical, Color Picker is niche)
