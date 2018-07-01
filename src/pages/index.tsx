import * as React from "react";
import Link from "gatsby-link";
import * as Msal from "msal";
import * as fetch from "isomorphic-fetch";

// Please note that you can use https://github.com/dotansimha/graphql-code-generator
// to generate all types from graphQL schema
interface IndexPageProps {
  data: {
    site: {
      siteMetadata: {
        title: string;
      };
    };
  };
}

const b2cScopes = [
  "https://agiddev.onmicrosoft.com/dev-portal-localhost/user_impersonation"
];

export default class extends React.Component<IndexPageProps, {}> {
  private userAgentApplication: Msal.UserAgentApplication;

  constructor(props: IndexPageProps, context: any) {
    super(props, context);
    // const authstring = 'https://login.microsoftonline.com/agiddev.onmicrosoft.com/oauth2/v2.0/login?p=B2C_1_SignUpIn';
    const authstring =
      "https://login.microsoftonline.com/tfp/agiddev.onmicrosoft.com/B2C_1_SignUpIn";
    this.userAgentApplication = new Msal.UserAgentApplication(
      "bc9e8adc-4ec3-4f5d-a443-7e5e62836ce3",
      authstring,
      (err, ret) => {
        if (ret) {
          console.log("UserAgentApplication %s", ret);
        }
        if (err) {
          console.error("UserAgentApplication %s", err);
        }
      },
      { cacheLocation: "localStorage" }
    );
  }

  public async openPopup() {
    this.userAgentApplication
      .acquireTokenSilent(b2cScopes)
      .catch(e => {
        console.error("acquireTokenSilent %s", e);
        return this.userAgentApplication.loginPopup(b2cScopes).then(_ => {
          return this.userAgentApplication
            .acquireTokenSilent(b2cScopes)
            .catch(e => {
              console.error("acquireTokenSilent_ %s", e);
              return this.userAgentApplication.acquireTokenPopup(b2cScopes);
            });
        });
      })
      .then(token => {
        console.log("token", token);

        const user = this.userAgentApplication.getUser();
        console.log("user", user);

        fetch("http://localhost:3000/test-auth", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          }
        }).then(ret => {
          if (ret !== void 0) {
            if (ret.status === 200) {
              ret.json().then(console.log);
            } else {
              console.error(ret.statusText);
            }
          }
        });
      })
      .catch(e => console.error("error acquiring token %s", e));
  }

  private logout() {
    this.userAgentApplication.logout();
  }

  public render() {
    return (
      <div>
        <h1>Hi people of bc9e8adc-4ec3-4f5d-a443-7e5e62836ce3 {b2cScopes}</h1>
        <p>
          Welcome to your new{" "}
          <strong>{this.props.data.site.siteMetadata.title}</strong> site.
        </p>
        <p>Now go build something great.</p>
        <button onClick={_ => this.openPopup()}>acquire ouath token</button>
        <button onClick={_ => this.logout()}>logout</button>
        <Link to="/page-2/">Go to page 2</Link>
      </div>
    );
  }
}

export const pageQuery = graphql`
  query IndexQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`;
