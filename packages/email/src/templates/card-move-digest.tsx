import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Link } from "@react-email/link";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
import { env } from "next-runtime-env";
import * as React from "react";

interface CardMovement {
  cardTitle: string;
  cardUrl: string;
  fromListName: string;
  toListName: string;
  movedByName: string;
  boardName: string;
}

export const CardMoveDigestTemplate = ({
  movements,
}: {
  movements: string;
}) => {
  const parsedMovements: CardMovement[] = JSON.parse(movements);
  const count = parsedMovements.length;

  return (
    <Html>
      <Head />
      <Preview>
        {`${count} card${count > 1 ? "s were" : " was"} moved`}
      </Preview>
      <Body style={{ backgroundColor: "white" }}>
        <Container
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            margin: "auto",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
          }}
        >
          <Heading
            style={{
              marginTop: "2.5rem",
              marginBottom: "2.5rem",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#232323",
            }}
          >
            Zadatko
          </Heading>
          <Heading
            style={{ fontSize: "20px", fontWeight: "bold", color: "#c5272f" }}
          >
            Stanje tvojih zadataka
          </Heading>
          <Text
            style={{
              fontSize: "0.875rem",
              color: "#232323",
              marginBottom: "1rem",
            }}
          >
            Imaš {count} {count > 1 ? "zadatka" : "zadatak"} ažuriran:
          </Text>
          {parsedMovements.map((movement, index) => (
            <Section
              key={index}
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                borderLeft: "3px solid #c5272f",
                backgroundColor: "#f9f9f9",
              }}
            >
              <Text
                style={{
                  fontSize: "0.875rem",
                  color: "#232323",
                  margin: "0 0 0.25rem 0",
                }}
              >
                <strong style={{ color: "#c5272f" }}>{movement.movedByName}</strong> premjestio/la{" "}
                <Link
                  href={movement.cardUrl}
                  style={{ color: "#282828", textDecoration: "underline" }}
                >
                  {movement.cardTitle}
                </Link>
              </Text>
              <Text
                style={{ fontSize: "0.75rem", color: "#666666", margin: "0" }}
              >
                {movement.fromListName} &rarr; {movement.toListName} u projektu{" "}
                {movement.boardName}
              </Text>
            </Section>
          ))}
          <Hr
            style={{
              marginTop: "2.5rem",
              marginBottom: "2rem",
              borderWidth: "1px",
            }}
          />
          <Text style={{ color: "#7e7e7e" }}>
            Zadatko - eSTUDENT aplikacija za praćenje zadataka, powered by -
            <Link
              href="https://kan.bn/"
              target="_blank"
              style={{ color: "#7e7e7e", textDecoration: "underline" }}
            >
              Kan
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CardMoveDigestTemplate;
