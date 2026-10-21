import { describe, it, expect } from "vitest";
import { mentionsAI } from "./mentionsAI.js";

describe("mentionsAI", () => {
  it("detects the uppercase French acronym IA as a whole word", () => {
    expect(mentionsAI("Notre IA et nous contre le legacy")).toBe(true);
  });

  it("does not match a lowercase 'ia' inside an unrelated word", () => {
    expect(mentionsAI("Un talk sur la sociabilité et la convivialité")).toBe(false);
  });

  it("detects 'agentique'", () => {
    expect(mentionsAI("Sobriété agentique - Réduire l'usage de tokens")).toBe(true);
  });

  it("detects 'chatbot'", () => {
    expect(mentionsAI("Créer un chatBot en interne sans vendre son âme au diable")).toBe(true);
  });

  it("detects 'machine learning'", () => {
    expect(mentionsAI("Introduction au Machine Learning pour les devs")).toBe(true);
  });

  it("detects a short acronym (llm, gpt, rag, nlp) only as a whole word", () => {
    expect(mentionsAI("Construire une app avec un LLM")).toBe(true);
    expect(mentionsAI("Exploiter le RAG pour enrichir vos réponses")).toBe(true);
  });

  it("does not match 'rag' as a substring of an unrelated word", () => {
    expect(mentionsAI("Write Antifragile & Domain-Driven tests")).toBe(false);
  });

  it("does not match a talk with no AI-related content", () => {
    expect(mentionsAI("Model Mitosis : ne plus se tromper entre les microservices et le monolithe")).toBe(false);
  });

  it("detects a mention buried deep in a long description", () => {
    const text =
      "Un talk sur le Domain-Driven Design, le découpage en modules, les microservices. " +
      "Avec l'essor récent de l'IA, nous avons décidé d'entamer la réflexion sur ce que pourrait être notre relation avec celles-ci.";
    expect(mentionsAI(text)).toBe(true);
  });
});
