import React, {
  MouseEventHandler,
  ReactElement,
  ReactNode,
  useState,
  useEffect,
  useRef,
} from 'react';
import Icon from '../../components/Icon';
import classNames from 'classnames';
import { useNavigate } from 'react-router';
import { notarizeRequest, useRequests } from '../../reducers/requests';
import { ErrorModal } from '../../components/ErrorModal';
import { useDispatch } from 'react-redux';
import {
  getMaxRecv,
  getMaxSent,
  getNotaryApi,
  getProxyApi,
} from '../../utils/storage';
import asset1 from '../../assets/img/asset1.svg';
import { useAllProofHistory } from '../../reducers/history';

export default function Home(): ReactElement {
  const requests = useRequests();
  const navigate = useNavigate();
  const [error, showError] = useState('');
  const dispatch = useDispatch();
  const history = useAllProofHistory();
  const prevStatusRef = useRef<{ [id: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const hasGraphqlRequest = requests.some((request) =>
    request.url.includes('graphql/query'),
  );

  // use this whenever you need to send the notarized request to any other place
  useEffect(() => {
    history.forEach((request) => {
      const prevStatus = prevStatusRef.current[request.id];
      if (prevStatus !== request.status) {
        if (request.status === 'success') {
          const requestInfo = `${request.method} ${request.url} HTTP/1.1\n`;
          const headers = Object.entries(request.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          const body = request.body || '';
          const alertMessage = `${requestInfo}${headers}\n\n${body}`;
          alert(alertMessage);
          setIsProcessing(false);
        } else if (request.status === 'error') {
          alert(
            `Notarization failed for request ${request.id}: ${request.error}`,
          );
          setIsProcessing(false);
        }
        prevStatusRef.current[request.id] = request.status || '';
      }
    });
  }, [history]);

  const simulateNotarizationSteps = async (firstGraphqlRequest: any) => {
    try {
      const headers = firstGraphqlRequest.requestHeaders.reduce(
        (acc: { [key: string]: string }, header: any) => {
          acc[header.name] = header.value ?? '';
          return acc;
        },
        {},
      );

      const maxSentData = await getMaxSent();
      const maxRecvData = await getMaxRecv();
      const notaryUrl = await getNotaryApi();
      const websocketProxyUrl = await getProxyApi();

      const requestHistory = {
        id: firstGraphqlRequest.requestId,
        url: firstGraphqlRequest.url,
        method: firstGraphqlRequest.method,
        headers,
        body: firstGraphqlRequest.requestBody ?? '',
        maxSentData,
        maxRecvData,
        notaryUrl,
        websocketProxyUrl,
        secretHeaders: [],
        secretResps: [],
        status: 'pending',
      };

      return requestHistory;
    } catch (err: any) {
      showError(`Failed to prepare notarization: ${err.message}`);
      throw err;
    }
  };

  const handleWeGucciClick = async () => {
    const firstGraphqlRequest = requests.find((request) =>
      request.url.includes('graphql/query'),
    );

    if (!firstGraphqlRequest) {
      showError('No request with "graphql" found');
    } else {
      try {
        setIsProcessing(true);
        const preparedRequest =
          await simulateNotarizationSteps(firstGraphqlRequest);

        dispatch(notarizeRequest(preparedRequest));
      } catch (err: any) {
        showError(`Failed to notarize request: ${err.message}`);
        setIsProcessing(false);
      }
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full bg-cover bg-no-repeat bg-center"
      style={{ backgroundImage: `url(${asset1})` }}
    >
      {error && <ErrorModal onClose={() => showError('')} message={error} />}

      <h1 className="text-5xl font-bold text-white mb-6">
        Verify your identity.
      </h1>

      <button
        onClick={handleWeGucciClick}
        className={classNames(
          'bg-black text-white px-8 py-4 rounded-full font-bold transition-all',
          {
            'hover:bg-gray-800': !isProcessing && hasGraphqlRequest,
            'opacity-50 cursor-not-allowed': isProcessing || !hasGraphqlRequest,
          },
        )}
        disabled={isProcessing || !hasGraphqlRequest}
      >
        {isProcessing ? (
          <div className="flex items-center">
            <Icon className="animate-spin mr-2" fa="fa-solid fa-spinner" />
            Processing...
          </div>
        ) : (
          'Verify'
        )}
      </button>
      {!hasGraphqlRequest && (
        <p className="text-red-500 mt-2">Reload the page.</p>
      )}
      {/* <NavButton fa="fa-solid fa-list" onClick={() => navigate('/history')}>
        History
      </NavButton> */}
    </div>
  );
}

// the NavButton above is only commented since it can be used for debugging later
// for now all requests are probably stored in the history page, but we gucci

function NavButton(props: {
  fa: string;
  children?: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  disabled?: boolean;
}): ReactElement {
  return (
    <button
      className={classNames(
        'flex flex-row flex-nowrap items-center justify-center',
        'text-white rounded px-2 py-1 gap-1',
        {
          'bg-primary/[.8] hover:bg-primary/[.7] active:bg-primary':
            !props.disabled,
          'bg-primary/[.5]': props.disabled,
        },
        props.className,
      )}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <Icon className="flex-grow-0 flex-shrink-0" fa={props.fa} size={1} />
      <span className="flex-grow flex-shrink w-0 flex-grow font-bold">
        {props.children}
      </span>
    </button>
  );
}
