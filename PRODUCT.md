# Product

## Register

product

## Users

Comtrya is for people and teams running their own code forge: maintainers, operators, and engineers who need repository hosting, review workflows, checks, extension management, and configuration evidence in one self-hosted instance. Users are usually working inside an authenticated product surface, switching between repositories and reviewing the state of code, automation, and installed extensions.

## Product Purpose

Comtrya is a self-host-first GitHub replacement with a deliberately small core. The host owns authentication, repositories, Git transport, policy, events, GraphQL, and extension runtime boundaries. Product features such as pull requests, code browsing, checks, boards, docs, and wiki are installed as extensions. The interface should make a single-tenant instance feel capable of many repositories and many feature surfaces without hiding which data comes from Git, runtime storage, or extensions.

## Brand Personality

Precise, composed, and operational. The UI should feel like an expert tool for people who trust dense information, clear hierarchy, and reliable affordances. It can borrow the discipline of Linear and GitHub without becoming decorative or marketing-led.

## Anti-references

Avoid generic SaaS dashboards, oversized hero sections, fake metrics, low-density cards, playful illustrations, glass effects, decorative gradients, and anything that makes a self-hosted forge feel like a landing page. The product should not imply features are core when they are extension-owned.

## Design Principles

- Make repository context the spine of the interface.
- Support polyrepo navigation even when the instance is single tenant.
- Treat extension surfaces as first-class product areas with visible load, resolver, and permission states.
- Keep evidence close to the workflow: refs, commits, checks, activity, clone details, and resolver output should be scannable without page hunting.
- Prefer dense, familiar controls over novelty.

## Accessibility & Inclusion

Target WCAG 2.2 AA for contrast, keyboard navigation, focus states, and responsive layout. Motion should be minimal and state-driven, and the UI must remain usable for reduced motion and color-blind users.
